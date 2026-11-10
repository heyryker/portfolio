import Link from "next/link";
import { LocalClock } from "@/components/LocalClock";

/**
 * "RYKER MARBLE" with today's date and my time in Utah under it, centered.
 * On the landing page it's the page's heading; on a project screen it sits
 * at the top of the left column and links home.
 */
export function NameAndTime({ heading = false }: { heading?: boolean }) {
  return (
    <div className="name-time">
      {heading ? (
        <h1 className="name-time-name">Ryker Marble</h1>
      ) : (
        <Link href="/" className="name-time-name">
          Ryker Marble
        </Link>
      )}
      <LocalClock />
    </div>
  );
}
