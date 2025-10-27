export interface BridgeResult {
  status: "completed" | "failed";
  error?: string;
  fromTxHash?: string;
  toTxHash?: string;
  db?: any;
}
