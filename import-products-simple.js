/**
 * Script de importação de produtos para o Firestore
 * Usa a configuração do Firebase já existente no projeto
 */

const admin = require('firebase-admin');
const fs = require('fs');

// Configuração do Firebase (mesma do projeto)
const firebaseConfig = {
  apiKey: "AIzaSyDI3BRH44JpubuDzFZzJ23OfFccZ2-0efo",
  authDomain: "biobox-1ad4a.firebaseapp.com",
  projectId: "biobox-1ad4a",
  storageBucket: "biobox-1ad4a.appspot.com",
  messagingSenderId: "782207164797",
  appId: "1:782207164797:web:a5d2d12d09733327456c14",
  measurementId: "G-JDQ4DYC5EH",
};

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: firebaseConfig.projectId,
});

const db = admin.firestore();

// Função para limpar e converter preço
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const cleaned = priceStr
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  return parseFloat(cleaned) || 0;
}

// Função para determinar categoria
function determineCategory(productName) {
  const name = productName.toUpperCase();
  if (name.includes('CAMA') || name.includes('3X1') || name.includes('BICAMA')) {
    return 'bed';
  }
  if (name.includes('COLCHAO') || name.includes('COLCHÃO')) {
    return 'mattress';
  }
  return 'accessory';
}

// Função para gerar SKU
function generateSKU(productName, index) {
  const prefix = productName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 3);
  return `${prefix}-${String(index).padStart(4, '0')}`;
}

// Função para ler e parsear o CSV
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const rows = [];

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = line.split(';');
    if (columns.length < 10) continue;

    const codigo = columns[0]?.trim() || '';
    const produto = columns[4]?.trim() || '';
    const tamanho = columns[5]?.trim() || '';
    const cor = columns[6]?.trim() || '';
    const tecido = columns[7]?.trim() || '';
    const cliente = columns[8]?.trim() || '';
    const preco = columns[9]?.trim() || '';

    if (!codigo || !produto || codigo === 'CODIGO DO PRODUTO') continue;

    rows.push({ codigo, produto, tamanho, cor, tecido, cliente, preco });
  }

  return rows;
}

// Agrupar variantes por produto
function groupVariantsByProduct(rows) {
  const grouped = new Map();

  for (const row of rows) {
    const productKey = row.produto;
    if (!productKey) continue;

    const variant = {
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
    grouped.get(productKey).push(variant);
  }

  return grouped;
}

// Extrair atributos únicos
function extractUniqueAttributes(variants) {
  const sizes = new Set();
  const colors = new Set();
  const fabrics = new Set();
  const customerPrices = {};

  for (const variant of variants) {
    if (variant.tamanho) sizes.add(variant.tamanho);
    if (variant.cor) colors.add(variant.cor);
    if (variant.tecido) fabrics.add(variant.tecido);

    if (variant.cliente && variant.preco > 0) {
      const key = variant.cliente;
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

// Calcular preço base
function calculateBasePrice(variants) {
  const prices = variants.map(v => v.preco).filter(p => p > 0);
  if (prices.length === 0) return 0;
  return prices.reduce((sum, p) => sum + p, 0) / prices.length;
}

// Criar produto no Firestore
async function createProduct(productName, variants, index) {
  const { sizes, colors, fabrics, customerPrices } = extractUniqueAttributes(variants);
  const basePrice = calculateBasePrice(variants);
  const costPrice = basePrice * 0.6;
  const margin = 40;

  const productData = {
    name: productName,
    sku: generateSKU(productName, index),
    category: determineCategory(productName),
    description: `Produto ${productName} com múltiplas variações`,
    basePrice: Math.round(basePrice),
    costPrice: Math.round(costPrice),
    margin,
    status: 'active',
    barcode: '',
    models: [
      {
        id: `model-${Date.now()}`,
        name: 'Standard',
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
          hexCode: '#000000',
          priceModifier: 1.0,
        })),
        fabrics: fabrics.map((fabric, idx) => ({
          id: `fabric-${idx}`,
          name: fabric,
          type: 'tecido',
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
    const docRef = await db.collection('products').add(productData);
    console.log(`✅ Produto criado: ${productName} (ID: ${docRef.id})`);
    return docRef.id;
  } catch (error) {
    console.error(`❌ Erro ao criar produto ${productName}:`, error.message);
    return null;
  }
}

// Verificar se produto existe
async function productExists(productName) {
  try {
    const snapshot = await db.collection('products').where('name', '==', productName).get();
    return !snapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar produto:', error.message);
    return false;
  }
}

// Função principal
async function importProducts(csvFilePath) {
  console.log('🚀 Iniciando importação de produtos...');
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

    const exists = await productExists(productName);
    if (exists) {
      console.log(`⏭️  Produto já existe, pulando...`);
      skipped++;
      continue;
    }

    const productId = await createProduct(productName, variants, index);
    if (productId) {
      created++;
      index++;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(50));
  console.log('✨ Importação concluída!');
  console.log(`✅ Produtos criados: ${created}`);
  console.log(`⏭️  Produtos pulados: ${skipped}`);
  console.log(`📊 Total processado: ${groupedProducts.size}`);
  console.log('='.repeat(50));
}

// Executar
const csvPath = process.argv[2] || '/home/ubuntu/produtos.csv';

if (!fs.existsSync(csvPath)) {
  console.error(`❌ Arquivo não encontrado: ${csvPath}`);
  process.exit(1);
}

importProducts(csvPath)
  .then(() => {
    console.log('🎉 Processo finalizado com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro durante importação:', error);
    process.exit(1);
  });
