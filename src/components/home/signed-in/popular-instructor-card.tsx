import { UserAvatar } from "@/components/shared/user-avatar";
import type { PopularInstructorItem } from "@/types/instructor";

/** Portrait card; instructors have no public page yet, so the card is not a link. */
export function PopularInstructorCard({
  item,
}: {
  item: PopularInstructorItem;
}) {
  return (
    <div className="relative aspect-[285/400] w-full overflow-hidden rounded-[30px] bg-muted">
      <UserAvatar
        name={item.display_name}
        src={item.avatar}
        alt=""
        size={285}
        unoptimized
        className="absolute inset-0 size-full rounded-none"
        textClassName="text-6xl"
      />
      <div
        className="absolute inset-0 bg-linear-to-b from-[39%] from-[rgba(201,59,59,0)] to-[rgba(0,0,0,0.5)]"
        aria-hidden
      />
      <div className="absolute inset-x-4 bottom-4 flex flex-col items-center gap-1 text-center text-white">
        <p className="line-clamp-1 text-2xl font-bold leading-[31px]">
          {item.display_name}
        </p>
        {item.subtitle ? (
          <p className="line-clamp-1 font-gilroy text-base leading-6">
            {item.subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
