import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

// Configuração do Firebase (deve estar em variáveis de ambiente ou arquivo de config)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface CSVRow {
  codigo: string;
  descricao: string;
  produto: string;
  tamanho: string;
  cor: string;
  tecido: string;
  cliente: string;
  preco: string;
}

interface ProductVariant {
  produto: string;
  tamanho: string;
  cor: string;
  tecido: string;
  cliente: string;
  preco: number;
}

// Função para limpar e converter preço
function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  // Remove "R$", espaços, pontos de milhar e converte vírgula para ponto
  const cleaned = priceStr
    .replace(/R\$/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  return parseFloat(cleaned) || 0;
}

// Função para determinar categoria baseada no nome do produto
function determineCategory(productName: string): string {
  const name = productName.toUpperCase();
  if (name.includes("CAMA") || name.includes("3X1") || name.includes("BICAMA")) {
    return "bed";
  }
  if (name.includes("COLCHAO") || name.includes("COLCHÃO")) {
    return "mattress";
  }
  return "accessory";
}

// Função para gerar SKU único
function generateSKU(productName: string, index: number): string {
  const prefix = productName
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .substring(0, 3);
  return `${prefix}-${String(index).padStart(4, "0")}`;
}

// Função para ler e parsear o CSV
function parseCSV(filePath: string): CSVRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const rows: CSVRow[] = [];

  // Pular as duas primeiras linhas (cabeçalhos)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = line.split(";");
    if (columns.length < 10) continue;

    const codigo = columns[0]?.trim() || "";
    const descricao = columns[1]?.trim() || "";
    const produto = columns[4]?.trim() || "";
    const tamanho = columns[5]?.trim() || "";
    const cor = columns[6]?.trim() || "";
    const tecido = columns[7]?.trim() || "";
    const cliente = columns[8]?.trim() || "";
    const preco = columns[9]?.trim() || "";

    // Ignorar linhas sem dados válidos
    if (!codigo || !produto || codigo === "CODIGO DO PRODUTO") continue;

    rows.push({
      codigo,
      descricao,
      produto,
      tamanho,
      cor,
      tecido,
      cliente,
      preco,
    });
  }

  return rows;
}

// Agrupar variantes por produto base
function groupVariantsByProduct(rows: CSVRow[]): Map<string, ProductVariant[]> {
  const grouped = new Map<string, ProductVariant[]>();

  for (const row of rows) {
    const productKey = row.produto;
    if (!productKey) continue;

    const variant: ProductVariant = {
      produto: row.produto,
      tamanho: row.tamanho,
      cor: row.cor,
      tecido: row.tecido,
      cliente: row.cliente,
      preco: parsePrice(row.preco),
    };

    if (!grouped.has(productKey)) {
      grouped.set(productKey, []);
    }
    grouped.get(productKey)!.push(variant);
  }

  return grouped;
}

// Extrair tamanhos, cores e tecidos únicos de um grupo de variantes
function extractUniqueAttributes(variants: ProductVariant[]) {
  const sizes = new Set<string>();
  const colors = new Set<string>();
  const fabrics = new Set<string>();
  const customerPrices: Record<string, number> = {};

  for (const variant of variants) {
    if (variant.tamanho) sizes.add(variant.tamanho);
    if (variant.cor) colors.add(variant.cor);
    if (variant.tecido) fabrics.add(variant.tecido);

    // Armazenar preços por cliente
    if (variant.cliente && variant.preco > 0) {
      const key = `${variant.cliente}`;
      if (!customerPrices[key] || variant.preco < customerPrices[key]) {
        customerPrices[key] = variant.preco;
      }
    }
  }

  return {
    sizes: Array.from(sizes),
    colors: Array.from(colors),
    fabrics: Array.from(fabrics),
    customerPrices,
  };
}

// Calcular preço base (média dos preços)
function calculateBasePrice(variants: ProductVariant[]): number {
  const prices = variants.map((v) => v.preco).filter((p) => p > 0);
  if (prices.length === 0) return 0;
  return prices.reduce((sum, p) => sum + p, 0) / prices.length;
}

// Criar produto no Firestore
async function createProduct(
  productName: string,
  variants: ProductVariant[],
  index: number,
) {
  const { sizes, colors, fabrics, customerPrices } =
    extractUniqueAttributes(variants);
  const basePrice = calculateBasePrice(variants);
  const costPrice = basePrice * 0.6; // Estimativa: 60% do preço base
  const margin = 40; // Margem de 40%

  const productData = {
    name: productName,
    sku: generateSKU(productName, index),
    category: determineCategory(productName),
    description: `Produto ${productName} com múltiplas variações`,
    basePrice: Math.round(basePrice),
    costPrice: Math.round(costPrice),
    margin,
    status: "active",
    barcode: "",
    models: [
      {
        id: `model-${Date.now()}`,
        name: "Standard",
        priceModifier: 1.0,
        stockQuantity: 0,
        minimumStock: 5,
        isActive: true,
        sizes: sizes.map((size, idx) => ({
          id: `size-${idx}`,
          name: size,
          dimensions: { width: 0, height: 0, depth: 0 },
          priceModifier: 1.0,
        })),
        colors: colors.map((color, idx) => ({
          id: `color-${idx}`,
          name: color,
          hexCode: "#000000",
          priceModifier: 1.0,
        })),
        fabrics: fabrics.map((fabric, idx) => ({
          id: `fabric-${idx}`,
          name: fabric,
          type: "tecido",
          priceModifier: 1.0,
        })),
      },
    ],
    specifications: [],
    images: [],
    customerPrices,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, "products"), productData);
    console.log(`✅ Produto criado: ${productName} (ID: ${docRef.id})`);
    return docRef.id;
  } catch (error) {
    console.error(`❌ Erro ao criar produto ${productName}:`, error);
    return null;
  }
}

// Verificar se produto já existe
async function productExists(productName: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, "products"),
      where("name", "==", productName),
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Erro ao verificar produto:", error);
    return false;
  }
}

// Função principal de importação
async function importProducts(csvFilePath: string) {
  console.log("🚀 Iniciando importação de produtos...");
  console.log(`📄 Lendo arquivo: ${csvFilePath}`);

  const rows = parseCSV(csvFilePath);
  console.log(`📊 Total de linhas lidas: ${rows.length}`);

  const groupedProducts = groupVariantsByProduct(rows);
  console.log(`📦 Total de produtos únicos: ${groupedProducts.size}`);

  let created = 0;
  let skipped = 0;
  let index = 1;

  for (const [productName, variants] of groupedProducts.entries()) {
    console.log(`\n🔍 Processando: ${productName} (${variants.length} variantes)`);

    // Verificar se já existe
    const exists = await productExists(productName);
    if (exists) {
      console.log(`⏭️  Produto já existe, pulando...`);
      skipped++;
      continue;
    }

    // Criar produto
    const productId = await createProduct(productName, variants, index);
    if (productId) {
      created++;
      index++;
    }

    // Aguardar um pouco para não sobrecarregar o Firestore
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n" + "=".repeat(50));
  console.log("✨ Importação concluída!");
  console.log(`✅ Produtos criados: ${created}`);
  console.log(`⏭️  Produtos pulados: ${skipped}`);
  console.log(`📊 Total processado: ${groupedProducts.size}`);
  console.log("=".repeat(50));
}

// Executar importação
const csvPath = process.argv[2] || "/home/ubuntu/produtos.csv";

if (!fs.existsSync(csvPath)) {
  console.error(`❌ Arquivo não encontrado: ${csvPath}`);
  process.exit(1);
}

importProducts(csvPath)
  .then(() => {
    console.log("🎉 Processo finalizado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro durante importação:", error);
    process.exit(1);
  });
