import { type JSONTableEnum } from "shared/types/tableSchema";

import EnumWrapper from "@/components/EnumWrapper";

interface EnumsProps {
  enums: JSONTableEnum[];
}

const Enums = ({ enums }: EnumsProps) => {
  return enums.map((e) => <EnumWrapper key={e.name} enumObj={e} />);
};

export default Enums;
