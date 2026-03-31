import CrudPage from "@/components/CrudPage";
import { Store } from "lucide-react";
import { vendorApi } from "@/lib/api";

const Vendors = () => <CrudPage title="Vendors" icon={Store} api={vendorApi} />;
export default Vendors;
