import { signIn } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) { const error = (await searchParams).error; return <main className="login"><form action={signIn}><p>SHANTINIKETAN ALUMNI</p><h1>Admin sign in</h1><span>Use your authorized administrator account.</span>{error && <div className="loginError">{error}</div>}<label>Email<Input name="email" type="email" required placeholder="admin@school.org" /></label><label>Password<Input name="password" type="password" required /></label><Button type="submit">Sign in securely</Button></form></main> }
