import { redirect } from "next/navigation";

export default function Home() {
  // We'll just redirect to dashboard for now. 
  // If not authenticated, the dashboard will redirect back to login.
  redirect("/dashboard");
}
