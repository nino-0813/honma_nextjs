"use client";

import InventorySystem from "@/admin/InventorySystem";
import InventoryWorkspace from "@/admin/InventoryWorkspace";

export default function AdminInventoryPage() {
  return <InventoryWorkspace ricePanel={<InventorySystem />} />;
}
