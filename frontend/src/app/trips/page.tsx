import { fetchPublicTrips } from "@/lib/api";
import { Trip } from "@/types";
import UpcomingTripsClient from "@/components/UpcomingTripsClient";

export const revalidate = 30;

export default async function TripsPage() {
  let trips: Trip[] = [];
  try {
    const allTrips = await fetchPublicTrips();
    trips = allTrips.filter((t) => t.status === "published");
  } catch (error) {
    console.error("Error fetching trips:", error);
  }

  return <UpcomingTripsClient trips={trips} />;
}
