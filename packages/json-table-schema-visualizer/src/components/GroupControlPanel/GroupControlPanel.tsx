import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, X, Check } from "lucide-react";

import type { JSONTableGroup } from "shared/types/tableGroup";

import { selectedTablesStore } from "@/stores/selectedTables";
import { tableGroupsStore } from "@/stores/tableGroups";

const PRESET_COLORS = [
  "#FF9800", // Orange
  "#4CAF50", // Green
  "#2196F3", // Blue
  "#9C27B0", // Purple
  "#F44336", // Red
  "#00BCD4", // Cyan
  "#FFEB3B", // Yellow
  "#795548", // Brown
];

const GroupControlPanel = () => {
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [groups, setGroups] = useState<Array<JSONTableGroup & { x: number; y: number; width: number; height: number }>>([]);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const unsubscribe = selectedTablesStore.subscribe((selected) => {
      setSelectedTables(selected);
    });

    // Actualizar lista de grupos
    const updateGroups = () => {
      setGroups(Array.from(tableGroupsStore.getAllGroups().values()));
    };
    updateGroups();

    return unsubscribe;
  }, []);

  const handleCreateGroup = () => {
    if (selectedTables.size === 0) {
      alert("Selecciona al menos una tabla para crear un grupo (Ctrl+Click en las tablas)");
      return;
    }

    const groupId = `group_${Date.now()}`;
    const newGroup: JSONTableGroup = {
      id: groupId,
      name: `Grupo ${groups.length + 1}`,
      color: PRESET_COLORS[groups.length % PRESET_COLORS.length],
      tableNames: Array.from(selectedTables),
      x: 50,
      y: 50,
      width: 600,
      height: 400,
    };

    tableGroupsStore.createGroup(newGroup);
    setGroups(Array.from(tableGroupsStore.getAllGroups().values()));
    selectedTablesStore.clearSelection();
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm("¿Estás seguro de eliminar este grupo?")) {
      tableGroupsStore.deleteGroup(groupId);
      setGroups(Array.from(tableGroupsStore.getAllGroups().values()));
    }
  };

  const handleStartEdit = (group: JSONTableGroup & { x: number; y: number; width: number; height: number }) => {
    setEditingGroup(group.id);
    setEditName(group.name);
    setEditColor(group.color);
  };

  const handleSaveEdit = () => {
    if (editingGroup) {
      const group = tableGroupsStore.getGroup(editingGroup);
      if (group) {
        tableGroupsStore.setGroup({
          ...group,
          name: editName,
          color: editColor,
        });
        setGroups(Array.from(tableGroupsStore.getAllGroups().values()));
      }
      setEditingGroup(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setEditName("");
    setEditColor("");
  };

  if (!isExpanded) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          Grupos ({groups.length})
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-96 max-h-[80vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Grupos de Tablas
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <X size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Info sobre selección */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          {selectedTables.size > 0 ? (
            <>
              <strong>{selectedTables.size}</strong> tabla{selectedTables.size !== 1 ? 's' : ''} seleccionada{selectedTables.size !== 1 ? 's' : ''}
            </>
          ) : (
            <>Usa <kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 rounded border">Ctrl</kbd> + Click para seleccionar tablas</>
          )}
        </p>
      </div>

      {/* Botón crear grupo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleCreateGroup}
          disabled={selectedTables.size === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={18} />
          Crear Grupo con Selección
        </button>
      </div>

      {/* Lista de grupos */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {groups.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No hay grupos creados.<br />
            Selecciona tablas y crea tu primer grupo.
          </p>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow"
            >
              {editingGroup === group.id ? (
                // Modo edición
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Nombre del grupo"
                  />
                  <div className="flex gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          editColor === color ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      <Check size={16} />
                      Guardar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      <X size={16} />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // Modo vista
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {group.name}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleStartEdit(group)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Edit2 size={16} className="text-blue-600 dark:text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {group.tableNames.length} tabla{group.tableNames.length !== 1 ? 's' : ''}: {group.tableNames.join(", ")}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GroupControlPanel;
