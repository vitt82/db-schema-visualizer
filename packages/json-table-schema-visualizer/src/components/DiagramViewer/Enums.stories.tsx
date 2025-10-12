import DiagramViewer from "./DiagramViewer";

import exampleData from "@/fake/fakeJsonTables";

export default {
  title: "Diagram/Enums",
};

export const EnumsStory = () => {
  return (
    <DiagramViewer
      refs={exampleData.refs}
      tables={exampleData.tables}
      enums={exampleData.enums}
    />
  );
};
