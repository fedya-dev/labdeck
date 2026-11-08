import { Dashboard } from '@/components/dashboard';
import { readConfig } from '@/lib/config-store';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const config = await readConfig();
  return <Dashboard config={config} />;
}
