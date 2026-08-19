export interface AsaasTransferApprovalPayload {
  type: string;
  transfer: {
    id: string;
    status: string;
  };
}
