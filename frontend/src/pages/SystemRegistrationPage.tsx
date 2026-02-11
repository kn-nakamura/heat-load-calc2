// System registration page (系統登録)

import { Box, Typography, Paper } from '@mui/material';
import { useState, useEffect } from 'react';
import { useSystemStore, useUIStore } from '../stores';
import { SystemTree, SystemForm } from '../components/system';
import { System } from '../types';
import { masterDataService } from '../db';

export const SystemRegistrationPage: React.FC = () => {
  const { systems, getSystemTree, addSystem, updateSystem, deleteSystem, selectSystem, selectedSystemId } =
    useSystemStore();
  const { showSnackbar } = useUIStore();

  const [formData, setFormData] = useState<Partial<System>>({});

  const selectedSystem = systems.find((s) => s.id === selectedSystemId);

  useEffect(() => {
    if (selectedSystem) {
      setFormData(selectedSystem);
    } else {
      setFormData({});
    }
  }, [selectedSystem]);

  const handleAddSystem = async (parentId: string | null) => {
    const now = new Date();

    // Calculate next order number for siblings
    const siblings = systems.filter((s) => s.parentId === parentId);
    const maxOrder = siblings.length > 0 ? Math.max(...siblings.map((s) => s.order)) : 0;

    const newSystem: System = {
      id: crypto.randomUUID(),
      name: '新規系統',
      parentId: parentId,
      roomIds: [],
      order: maxOrder + 1,
      notes: '',
      createdAt: now,
      updatedAt: now,
    };

    try {
      addSystem(newSystem);
      await masterDataService.saveAllMasterData();
      selectSystem(newSystem.id);
      showSnackbar('新規系統を追加しました', 'success');
    } catch (error) {
      console.error('Add error:', error);
      showSnackbar('追加に失敗しました', 'error');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedSystemId || !formData.name) {
      showSnackbar('系統名を入力してください', 'error');
      return;
    }

    try {
      updateSystem(selectedSystemId, formData);
      await masterDataService.saveAllMasterData();
      showSnackbar('保存しました', 'success');
    } catch (error) {
      console.error('Save error:', error);
      showSnackbar('保存に失敗しました', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const system = systems.find((s) => s.id === id);
    if (!system) return;

    // Check if system has children
    const hasChildren = systems.some((s) => s.parentId === id);
    if (hasChildren) {
      if (
        !window.confirm(
          'この系統には子系統があります。削除すると子系統は親なし（ルート）になります。本当に削除しますか？'
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm(`「${system.name}」を削除しますか？`)) {
        return;
      }
    }

    try {
      deleteSystem(id);
      await masterDataService.saveAllMasterData();
      selectSystem(null);
      showSnackbar('削除しました', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      showSnackbar('削除に失敗しました', 'error');
    }
  };

  const systemTree = getSystemTree();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        系統登録
      </Typography>

      <Paper sx={{ mt: 2, height: 'calc(100vh - 180px)', display: 'flex' }}>
        {/* Left: System Tree */}
        <Box sx={{ width: '400px', minWidth: '400px', borderRight: 1, borderColor: 'divider' }}>
          <SystemTree
            nodes={systemTree}
            selectedId={selectedSystemId}
            onSelect={selectSystem}
            onAddChild={handleAddSystem}
            onDelete={handleDelete}
          />
        </Box>

        {/* Right: System Form */}
        <Box sx={{ flexGrow: 1 }}>
          <SystemForm
            selectedId={selectedSystemId}
            formData={formData}
            onChange={handleChange}
            onSave={handleSave}
            onDelete={() => selectedSystemId && handleDelete(selectedSystemId)}
          />
        </Box>
      </Paper>
    </Box>
  );
};
