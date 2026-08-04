import { PdfSnapshotHashService } from "../../services/pdf-snapshot-hash.service";

describe("PdfSnapshotHashService", () => {
  it("should create deterministic hash for same snapshot", () => {
    const service = new PdfSnapshotHashService();
    const snapshot = { budgetNumber: "ORC-2026-00001", totalAmount: 1000 };

    const hash1 = service.hashSnapshot(snapshot);
    const hash2 = service.hashSnapshot(snapshot);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });
});
