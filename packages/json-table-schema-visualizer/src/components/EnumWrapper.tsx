import { type JSONTableEnum } from "shared/types/tableSchema";

import Enum from "@/components/Enum";
import { useGetEnumMinWidth } from "@/hooks/enum";
import EnumDimensionProvider from "@/providers/EnumDimension";

interface EnumWrapperProps {
  enumObj: JSONTableEnum;
}

const EnumWrapper = ({ enumObj }: EnumWrapperProps) => {
  const width = useGetEnumMinWidth(enumObj);

  return (
    <EnumDimensionProvider width={width}>
      <Enum {...enumObj} />
    </EnumDimensionProvider>
  );
};

export default EnumWrapper;
