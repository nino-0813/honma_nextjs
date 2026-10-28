"use client";

import InventorySystem from "@/admin/InventorySystem";
import InventoryWorkspace from "@/admin/InventoryWorkspace";
import ShiitakeBaselineSettings from "@/admin/ShiitakeBaselineSettings";

export default function AdminInventoryPage() {
  return <InventoryWorkspace ricePanel={<InventorySystem />} shiitakeSettings={<ShiitakeBaselineSettings />} />;
}
