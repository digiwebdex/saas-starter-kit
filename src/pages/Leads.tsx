import CrudPage from "@/components/CrudPage";
import { Target } from "lucide-react";
import { leadApi } from "@/lib/api";

const Leads = () => <CrudPage title="Leads" icon={Target} api={leadApi} />;
export default Leads;
