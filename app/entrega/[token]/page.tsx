import { DeliveryConfirmationClient } from "@/components/delivery/delivery-confirmation-client"

export default async function DeliveryQrPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return (
    <div className="container mx-auto py-10 px-4">
      <DeliveryConfirmationClient token={decodeURIComponent(token)} />
    </div>
  )
}
