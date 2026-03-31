import CrudPage from "@/components/CrudPage";
import { UserCheck } from "lucide-react";
import { clientApi } from "@/lib/api";

const Clients = () => <CrudPage title="Clients" icon={UserCheck} api={clientApi} />;
export default Clients;
