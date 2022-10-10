import { differenceInYears } from "date-fns";
import { UserV2 } from "twitter-api-v2";

export default function shouldFollow(user: UserV2): boolean {
  return (
    user.public_metrics?.following_count! > 100 &&
    user.public_metrics?.followers_count! > 100 &&
    user.public_metrics?.tweet_count! > 100 &&
    user.public_metrics?.listed_count! > 0 &&
    user.profile_image_url !== "" &&
    user.description !== "" &&
    differenceInYears(new Date(), new Date(user.created_at!)) > 0
  );
}
