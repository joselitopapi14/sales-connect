"use client";

import { useState } from "react";
import { InputGroupRequest } from "@/components/InputGroupRequest";
import { CarritoList } from "@/components/CarritoList";

export default function SolicitudesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="min-h-screen mt-5 pt-24 pb-16">
      <div className="mx-auto px-4 max-w-6xl space-y-8">
        <div className="flex justify-center">
          <InputGroupRequest onSuccess={() => setRefreshTrigger(prev => prev + 1)} />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-700">Mis Solicitudes</h2>
          <CarritoList refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
