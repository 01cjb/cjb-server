import { redirect } from "next/navigation";
import { getMe, myAddresses } from "@/lib/me";
import ProfileForm from "@/components/me/ProfileForm";
export default async function Profile() {
  const me = await getMe();
  if (!me.user) redirect("/login?next=/mypage/profile");
  return <div><h1 className="text-xl font-bold mb-4">회원 · 사업자 정보</h1><ProfileForm u={me.user} addresses={await myAddresses()} /></div>;
}
