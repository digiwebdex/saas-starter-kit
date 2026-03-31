import CrudPage from "@/components/CrudPage";
import { ListTodo } from "lucide-react";
import { taskApi } from "@/lib/api";

const Tasks = () => <CrudPage title="Tasks" icon={ListTodo} api={taskApi} />;
export default Tasks;
