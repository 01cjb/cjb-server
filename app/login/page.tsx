import { Suspense } from "react";
import StoreLoginForm from "@/components/me/StoreLoginForm";
import { getMe } from "@/lib/me";
import { company } from "@/lib/company";

export const metadata = { title: "로그인" };
export const dynamic = "force-dynamic";

export default async function Login() {
  const me = await getMe();
  return (
    <Suspense>
      <StoreLoginForm already={!me.mock && !!me.user} name={me.user?.name ?? null} testOn={process.env.TEST_LOGIN !== "off"} tel={company.tel} />
    </Suspense>
  );
}
