import ImportPanel from "@/components/admin/ImportPanel";
import Act from "@/components/admin/Act";
import Pill from "@/components/admin/Pill";
import { H1, Table } from "@/components/admin/Table";
import { listBatches } from "@/lib/admin/repo";
import { dt } from "@/lib/fmt";

const BS: Record<string, string> = { validated: "검증", imported: "등록완료", partially_imported: "일부등록", failed: "실패", reverted: "되돌림" };

export default async function ImportPage() {
  const batches = await listBatches();
  return (
    <>
      <H1>엑셀 대량등록</H1>
      <ImportPanel />
      <h2 className="font-semibold text-sm mt-8 mb-2">등록 이력</h2>
      <Table head={["#", "파일", "전체", "성공", "오류", "상태", "일시", ""]} empty={!batches.length}>
        {batches.map((b) => (
          <tr key={b.id}>
            <td className="tabular-nums text-xs">{b.id}</td><td>{b.file_name}</td><td className="tabular-nums">{b.total_rows}</td>
            <td className="tabular-nums text-emerald-700">{b.success_rows}</td><td className="tabular-nums text-rose-600">{b.error_rows}</td>
            <td><Pill s={b.status} label={BS[b.status]} /></td><td className="text-xs text-neutral-500">{dt(b.created_at)}</td>
            <td>{b.status !== "reverted" && <Act url={`/api/admin/import-batches/${b.id}/revert`} ask="되돌리기 사유" label="되돌리기" tone="danger" />}</td>
          </tr>
        ))}
      </Table>
      <p className="text-xs text-neutral-400 mt-2">되돌리기: 해당 배치로 등록된 상품 전체를 ‘등록취소’로 바꿉니다. 상품관리 › 등록취소 탭에서 개별 복구할 수 있습니다.</p>
    </>
  );
}
