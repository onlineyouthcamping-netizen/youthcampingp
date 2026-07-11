import { getQuotationSmart } from "@/lib/db-smart";
import PremiumQuoteLanding from "@/components/PremiumQuoteLanding";
import { notFound } from "next/navigation";

export default async function Page({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ slug: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { slug } = await params;
    const sParams = await searchParams;
    const isAdmin = sParams.isAdmin === 'true';
    const token = typeof sParams.token === 'string' ? sParams.token : '';
    
    const data = await getQuotationSmart(slug, isAdmin, token);

    if (!data) {
        console.log(`[Page: /quote/${slug}] Data not found. Triggering 404.`);
        return notFound();
    }

    // Block access to draft quotes unless user is admin
    if (data.status === 'draft' && !isAdmin) {
        console.log(`[Page: /quote/${slug}] Attempt to access draft quote blocked.`);
        return notFound();
    }

    return <PremiumQuoteLanding q={data} />;
}
