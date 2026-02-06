import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  processCSVImport,
  generateImportPreview,
  CSVImportResult,
  ImportPreviewItem,
} from "@/lib/csvImporter";
import { Product } from "@/types/inventory";
import { Customer } from "@/types/customer";
import {
  AlertCircle,
  CheckCircle,
  Upload,
  FileText,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CSVImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  customers: Customer[];
  onImportComplete: (result: CSVImportResult) => void;
  isImporting: boolean;
}

type ImportStep = "upload" | "preview" | "confirming" | "complete";

export default function CSVImporter({
  open,
  onOpenChange,
  products,
  customers,
  onImportComplete,
  isImporting,
}: CSVImporterProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [csvContent, setCSVContent] = useState("");
  const [importResult, setImportResult] = useState<CSVImportResult | null>(
    null,
  );
  const [preview, setPreview] = useState<ImportPreviewItem[]>([]);
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv") && !file.type.includes("text")) {
      setError("Por favor, selecione um arquivo CSV válido");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setCSVContent(content);
        setError("");

        // Generate preview
        const previewData = generateImportPreview(content, products);
        setPreview(previewData);
        setStep("preview");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao processar arquivo";
        setError(message);
      }
    };
    reader.onerror = () => {
      setError("Erro ao ler arquivo");
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    try {
      setStep("confirming");
      const result = processCSVImport(csvContent, products, customers);
      setImportResult(result);
      onImportComplete(result);
      setStep("complete");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao processar importação";
      setError(message);
      setStep("preview");
    }
  };

  const handleClose = () => {
    setStep("upload");
    setCSVContent("");
    setImportResult(null);
    setPreview([]);
    setError("");
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = [
      "SKU\tPRODUTO\tTAMANHO\tCOR\tTECIDO\tCLIENTE\tPREÇO",
      "BED-001\tCama Luxo\tCasal\tBranco\tCourino\tMóveis Premium Ltda\t2500.00",
      "BED-002\tCama Standard\tSolteiro\tMarrom\tTecido\tJoão Silva\t1800.00",
    ].join("\n");

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(template),
    );
    element.setAttribute("download", "template_produtos.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Produtos via CSV
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6">
            <Card className="bg-muted/5 border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Formato Esperado</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      A planilha deve estar em formato TSV (Tab-Separated
                      Values) com as seguintes colunas:
                    </p>
                    <div className="bg-background p-3 rounded border border-border text-xs font-mono overflow-x-auto">
                      SKU | PRODUTO | TAMANHO | COR | TECIDO | CLIENTE | PREÇO
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Observações importantes:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>SKU e PRODUTO são obrigatórios</li>
                      <li>
                        TAMANHO, COR e TECIDO são opcionais (apenas para
                        referência)
                      </li>
                      <li>CLIENTE vazio = nenhum vínculo de preço criado</li>
                      <li>PREÇO vazio = nenhum vínculo de preço criado</li>
                      <li>
                        Se SKU já existe, apenas atualiza campos fornecidos
                      </li>
                      <li>Linhas inválidas são ignoradas silenciosamente</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="border-2 border-dashed border-border rounded-lg p-8">
              <div className="flex flex-col items-center justify-center text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="font-medium mb-2">Selecionar arquivo CSV</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Arrastar arquivo aqui ou clicar para selecionar
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv,.tsv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button variant="outline" className="pointer-events-none">
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Arquivo
                  </Button>
                </label>
              </div>
            </div>

            {error && (
              <Card className="bg-red-500/10 border-red-500/20">
                <CardContent className="p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-200">
                      Erro
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={downloadTemplate}>
                <FileText className="h-4 w-4 mr-2" />
                Baixar Template
              </Button>
              <Button onClick={handleClose} variant="outline">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-6">
            <Card className="bg-muted/5">
              <CardHeader>
                <CardTitle className="text-base">
                  Resumo da Importação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Total de Linhas
                    </p>
                    <p className="text-2xl font-bold">{preview.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      A Criar
                    </p>
                    <p className="text-2xl font-bold text-green-500">
                      {preview.filter((p) => p.action === "create").length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      A Atualizar
                    </p>
                    <p className="text-2xl font-bold text-blue-500">
                      {preview.filter((p) => p.action === "update").length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      A Ignorar
                    </p>
                    <p className="text-2xl font-bold text-orange-500">
                      {preview.filter((p) => p.action === "skip").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">Todos ({preview.length})</TabsTrigger>
                <TabsTrigger value="create">
                  Criar ({preview.filter((p) => p.action === "create").length})
                </TabsTrigger>
                <TabsTrigger value="update">
                  Atualizar (
                  {preview.filter((p) => p.action === "update").length})
                </TabsTrigger>
                <TabsTrigger value="skip">
                  Ignorar ({preview.filter((p) => p.action === "skip").length})
                </TabsTrigger>
              </TabsList>

              {["all", "create", "update", "skip"].map((filter) => (
                <TabsContent key={filter} value={filter}>
                  <ScrollArea className="h-[400px] border border-border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Linha</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead>Tamanho</TableHead>
                          <TableHead>Cor</TableHead>
                          <TableHead>Tecido</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead className="w-24">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview
                          .filter((item) =>
                            filter === "all" ? true : item.action === filter,
                          )
                          .map((item) => (
                            <TableRow key={`${item.row}`}>
                              <TableCell className="text-xs font-medium">
                                {item.row}
                              </TableCell>
                              <TableCell className="text-sm font-mono">
                                {item.sku}
                              </TableCell>
                              <TableCell className="text-sm">
                                {item.produto}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {item.tamanho || "-"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {item.cor || "-"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {item.tecido || "-"}
                              </TableCell>
                              <TableCell className="text-sm">
                                {item.cliente ? (
                                  <Badge variant="outline" className="text-xs">
                                    {item.cliente}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm font-medium">
                                {item.preco ? (
                                  <span className="text-biobox-gold">
                                    R$ {item.preco}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    item.action === "create" &&
                                      "bg-green-500/10 text-green-600 border-green-500/20",
                                    item.action === "update" &&
                                      "bg-blue-500/10 text-blue-600 border-blue-500/20",
                                    item.action === "skip" &&
                                      "bg-orange-500/10 text-orange-600 border-orange-500/20",
                                  )}
                                >
                                  {item.action === "create" && (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Criar
                                    </>
                                  )}
                                  {item.action === "update" && (
                                    <>
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Atualizar
                                    </>
                                  )}
                                  {item.action === "skip" && (
                                    <>
                                      <X className="h-3 w-3 mr-1" />
                                      Ignorar
                                    </>
                                  )}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Voltar
              </Button>
              <Button onClick={handleClose} variant="outline">
                Cancelar
              </Button>
              <Button
                className="bg-biobox-gold hover:bg-biobox-gold-dark"
                onClick={handleConfirmImport}
                disabled={isImporting}
              >
                {isImporting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Confirmar Importação
              </Button>
            </div>
          </div>
        )}

        {step === "confirming" && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-biobox-gold" />
              <p className="text-muted-foreground">Processando importação...</p>
            </div>
          </div>
        )}

        {step === "complete" && importResult && (
          <div className="space-y-6">
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-6 flex gap-4">
                <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-green-900 dark:text-green-200 mb-1">
                    Importação Concluída com Sucesso
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-300">
                    Os dados foram processados e salvos.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumo Final</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span>Total de Linhas Processadas:</span>
                    <span className="font-medium">
                      {importResult.summary.totalRows}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span>Produtos Criados:</span>
                    <span className="font-medium text-green-600">
                      +{importResult.summary.created}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span>Produtos Atualizados:</span>
                    <span className="font-medium text-blue-600">
                      +{importResult.summary.updated}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span>Preços de Cliente Definidos:</span>
                    <span className="font-medium text-biobox-gold">
                      +{importResult.summary.customerPricesSet}
                    </span>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="flex justify-between py-2 pt-2">
                      <span>Avisos/Erros:</span>
                      <span className="font-medium text-orange-600">
                        {importResult.errors.length}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {importResult.errors.length > 0 && (
              <Card className="bg-orange-500/10 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-orange-900 dark:text-orange-200">
                    <AlertTriangle className="h-5 w-5" />
                    Avisos e Erros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {importResult.errors.map((error, idx) => (
                        <div
                          key={idx}
                          className="text-sm p-2 bg-orange-500/5 rounded border border-orange-500/20"
                        >
                          <span className="font-mono text-xs text-muted-foreground">
                            Linha {error.row}:
                          </span>{" "}
                          {error.message}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-3">
              <Button
                onClick={handleClose}
                className="bg-biobox-gold hover:bg-biobox-gold-dark"
              >
                Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
