"use client";

import { FieldDemo } from "@/components/FieldDemo";
import { DataTable } from "@/components/data-table";
import { columns } from "@/data/users/columns";
import { UsersProvider, useUsers } from "@/contexts/UsersContext";

function UsersContent() {
  const { users } = useUsers();

  return (
    <div className="container mx-auto py-10 h-screen flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Create, read, update, and delete users in your system.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        <div className="lg:col-span-1">
          <FieldDemo />
        </div>
        
        <div className="lg:col-span-2 min-h-0">
          <DataTable columns={columns} data={users} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <UsersProvider>
      <UsersContent />
    </UsersProvider>
  );
}
