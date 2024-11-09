import axios from "axios";
import { getStatus } from "./utils";
import { OrderStatus } from "../../prisma/generated/type-graphql";

export const sendOrderStatusNotification = async ({
  status,
  userId,
}: {
  status: OrderStatus;
  userId: string;
}) => {
  const formatedStatus = getStatus[status];
  const message = `Your order status is now: ${formatedStatus}`;

  await axios.post(
    "https://onesignal.com/api/v1/notifications",
    {
      app_id: "639c1adc-b9ff-4581-bb8c-7238eb64cf0d",
      contents: { en: message },
      headings: { en: "Order Update" },
      include_external_user_ids: [userId],
    },
    {
      headers: {
        Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
};
