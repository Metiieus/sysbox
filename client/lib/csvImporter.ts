import { Product } from "@/types/inventory";
import { Customer } from "@/types/customer";

export interface CSVRow {
  sku: string;
  produto: string;
  tamanho: string;
  cor: string;
  tecido: string;
  cliente: string;
  preco: string;
}

export interface CSVImportResult {
  productsToCreate: Partial<Product>[];
  productsToUpdate: Array<{ id: string; data: Partial<Product> }>;
  errors: Array<{ row: number; message: string }>;
  summary: {
    totalRows: number;
    validRows: number;
    created: number;
    updated: number;
    customerPricesSet: number;
  };
}

export interface ImportPreviewItem {
  row: number;
  sku: string;
  produto: string;
  tamanho: string;
  cor: string;
  tecido: string;
  cliente: string;
  preco: string;
  action: "create" | "update" | "skip";
  reason?: string;
}

const detectDelimiter = (headerLine: string): string => {
  const tabCount = (headerLine.match(/\t/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;

  if (semicolonCount > tabCount) {
    return ";";
  }
  return "\t";
};

const parseCSV = (csvText: string): CSVRow[] => {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV deve conter cabeçalho e pelo menos uma linha de dados");
  }

  // Detect delimiter (tab or semicolon)
  const delimiter = detectDelimiter(lines[0]);

  // Parse header
  const header = lines[0]
    .split(delimiter)
    .map((h) => h.trim().toLowerCase());

  // Required columns
  const requiredColumns = ["sku", "produto"];
  const missingColumns = requiredColumns.filter((col) =>
    !header.includes(col)
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Colunas obrigatórias ausentes: ${missingColumns.join(", ")}`
    );
  }

  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.trim());

    const row: CSVRow = {
      sku: values[header.indexOf("sku")] || "",
      produto: values[header.indexOf("produto")] || "",
      tamanho: values[header.indexOf("tamanho")] || "",
      cor: values[header.indexOf("cor")] || "",
      tecido: values[header.indexOf("tecido")] || "",
      cliente: values[header.indexOf("cliente")] || "",
      preco: values[header.indexOf("preco")] || "",
    };

    rows.push(row);
  }

  return rows;
};

export const processCSVImport = (
  csvText: string,
  existingProducts: Product[],
  allCustomers: Customer[]
): CSVImportResult => {
  const rows = parseCSV(csvText);
  const productsToCreate: Partial<Product>[] = [];
  const productsToUpdate: Array<{ id: string; data: Partial<Product> }> = [];
  const errors: Array<{ row: number; message: string }> = [];

  let customerPricesSet = 0;
  const skuMap = new Map<string, Partial<Product>>();

  // Build SKU map from existing products
  existingProducts.forEach((p) => {
    skuMap.set(p.sku.toLowerCase(), { ...p });
  });

  // Process each row
  rows.forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2; // +2 because of header and 1-based indexing

    // Skip if SKU is empty
    if (!row.sku || row.sku.trim() === "") {
      errors.push({
        row: rowNumber,
        message: "SKU vazio - linha ignorada",
      });
      return;
    }

    const skuLower = row.sku.toLowerCase();

    // Check if product already exists
    const existingProduct = skuMap.get(skuLower);

    if (existingProduct && existingProduct.id) {
      // Update existing product
      const updateData: Partial<Product> = {};

      // Update name if provided
      if (row.produto && row.produto.trim() !== "") {
        updateData.name = row.produto.trim();
      }

      // Update description with variants if provided
      if (row.tamanho || row.cor || row.tecido) {
        const variants = [
          row.tamanho,
          row.cor,
          row.tecido,
        ]
          .filter((v) => v && v.trim() !== "")
          .join(" | ");

        if (variants) {
          updateData.description = variants;
        }
      }

      // Handle customer price
      if (row.cliente && row.cliente.trim() !== "" && row.preco && row.preco.trim() !== "") {
        const customer = allCustomers.find(
          (c) => c.name.toLowerCase() === row.cliente.toLowerCase()
        );

        if (customer) {
          const price = parseFloat(row.preco.replace(",", "."));
          if (!isNaN(price) && price > 0) {
            if (!updateData.customerPrices) {
              updateData.customerPrices =
                existingProduct.customerPrices || {};
            }
            updateData.customerPrices[customer.id] = price;
            customerPricesSet++;
          } else {
            errors.push({
              row: rowNumber,
              message: `Preço inválido para cliente "${row.cliente}" (valor: ${row.preco}) - preço não atualizado`,
            });
          }
        } else {
          errors.push({
            row: rowNumber,
            message: `Cliente "${row.cliente}" não encontrado - preço não atualizado`,
          });
        }
      }

      // Only add to update list if we have something to update
      if (Object.keys(updateData).length > 0) {
        productsToUpdate.push({
          id: existingProduct.id,
          data: updateData,
        });
      }
    } else {
      // Create new product
      if (!row.produto || row.produto.trim() === "") {
        errors.push({
          row: rowNumber,
          message: "PRODUTO vazio - linha ignorada",
        });
        return;
      }

      const newProduct: Partial<Product> = {
        sku: row.sku.trim(),
        name: row.produto.trim(),
        category: "bed",
        status: "active",
        basePrice: 0,
        costPrice: 0,
        margin: 0,
        description: "",
        specifications: [],
        images: [],
        models: [
          {
            id: `model-${Date.now()}-${Math.random()}`,
            name: "Standard",
            priceModifier: 1,
            stockQuantity: 0,
            minimumStock: 0,
            isActive: true,
            sizes: [],
            colors: [],
            fabrics: [],
          },
        ],
      };

      // Add variant information to description
      if (row.tamanho || row.cor || row.tecido) {
        const variants = [
          row.tamanho,
          row.cor,
          row.tecido,
        ]
          .filter((v) => v && v.trim() !== "")
          .join(" | ");

        if (variants) {
          newProduct.description = variants;
        }
      }

      // Handle customer price
      if (row.cliente && row.cliente.trim() !== "" && row.preco && row.preco.trim() !== "") {
        const customer = allCustomers.find(
          (c) => c.name.toLowerCase() === row.cliente.toLowerCase()
        );

        if (customer) {
          const price = parseFloat(row.preco.replace(",", "."));
          if (!isNaN(price) && price > 0) {
            newProduct.customerPrices = { [customer.id]: price };
            customerPricesSet++;
          } else {
            errors.push({
              row: rowNumber,
              message: `Preço inválido para cliente "${row.cliente}" (valor: ${row.preco}) - preço não atualizado`,
            });
          }
        } else {
          errors.push({
            row: rowNumber,
            message: `Cliente "${row.cliente}" não encontrado - preço não atualizado`,
          });
        }
      }

      productsToCreate.push(newProduct);
      skuMap.set(skuLower, newProduct);
    }
  });

  return {
    productsToCreate,
    productsToUpdate,
    errors,
    summary: {
      totalRows: rows.length,
      validRows: rows.length - errors.length,
      created: productsToCreate.length,
      updated: productsToUpdate.length,
      customerPricesSet,
    },
  };
};

export const generateImportPreview = (
  csvText: string,
  existingProducts: Product[]
): ImportPreviewItem[] => {
  const rows = parseCSV(csvText);
  const preview: ImportPreviewItem[] = [];

  rows.forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2;

    if (!row.sku || row.sku.trim() === "") {
      preview.push({
        row: rowNumber,
        sku: row.sku,
        produto: row.produto,
        tamanho: row.tamanho,
        cor: row.cor,
        tecido: row.tecido,
        cliente: row.cliente,
        preco: row.preco,
        action: "skip",
        reason: "SKU vazio",
      });
      return;
    }

    if (!row.produto || row.produto.trim() === "") {
      preview.push({
        row: rowNumber,
        sku: row.sku,
        produto: row.produto,
        tamanho: row.tamanho,
        cor: row.cor,
        tecido: row.tecido,
        cliente: row.cliente,
        preco: row.preco,
        action: "skip",
        reason: "PRODUTO vazio",
      });
      return;
    }

    const existingProduct = existingProducts.find(
      (p) => p.sku.toLowerCase() === row.sku.toLowerCase()
    );

    if (existingProduct) {
      preview.push({
        row: rowNumber,
        sku: row.sku,
        produto: row.produto,
        tamanho: row.tamanho,
        cor: row.cor,
        tecido: row.tecido,
        cliente: row.cliente,
        preco: row.preco,
        action: "update",
        reason: "SKU já existe",
      });
    } else {
      preview.push({
        row: rowNumber,
        sku: row.sku,
        produto: row.produto,
        tamanho: row.tamanho,
        cor: row.cor,
        tecido: row.tecido,
        cliente: row.cliente,
        preco: row.preco,
        action: "create",
      });
    }
  });

  return preview;
};
