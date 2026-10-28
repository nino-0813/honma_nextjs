"use client";
import { useState } from 'react';

import InventorySystem from "@/admin/InventorySystem";
import InventoryWorkspace from "@/admin/InventoryWorkspace";
import ShiitakeBaselineSettings from "@/admin/ShiitakeBaselineSettings";
import ShiitakeLiveInventory from "@/admin/ShiitakeLiveInventory";
import ExternalOrderReview from "@/admin/ExternalOrderReview";

export default function AdminInventoryPage() {
  const[refreshKey,setRefreshKey]=useState(0);
  return <InventoryWorkspace ricePanel={<InventorySystem />} shiitakeSettings={<ShiitakeBaselineSettings onSaved={()=>setRefreshKey(k=>k+1)}/>} shiitakePanel={<ShiitakeLiveInventory refreshKey={refreshKey}/>} externalPanel={<ExternalOrderReview />} />;
}
