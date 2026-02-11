// Room registration page (室登録)

import { Box, Typography, Paper, Tabs, Tab, Button } from '@mui/material';
import { Save as SaveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useRoomStore, useUIStore } from '../stores';
import {
  RoomList,
  RoomBasicForm,
  EnvelopeTable,
  RoomIndoorConditionsForm,
  RoomCalculationConditionsForm,
  RoomSystemNotesForm,
} from '../components/room';
import { Room, RoomListItem } from '../types';
import { masterDataService } from '../db';

type RoomTab = 'basic' | 'envelope' | 'indoor' | 'calculation' | 'system';

export const RoomRegistrationPage: React.FC = () => {
  const { rooms, addRoom, updateRoom, deleteRoom } = useRoomStore();
  const { showSnackbar } = useUIStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<RoomTab>('basic');
  const [formData, setFormData] = useState<Partial<Room>>({});

  const selectedRoom = rooms.find((r) => r.id === selectedId);

  useEffect(() => {
    if (selectedRoom) {
      setFormData(selectedRoom);
    }
  }, [selectedRoom]);

  const handleAddRoom = async () => {
    const now = new Date();
    const newRoom: Room = {
      id: crypto.randomUUID(),
      floor: '1F',
      roomNumber: '',
      roomName: '新規室',
      floorAreaFormula: '',
      floorArea: 0,
      floorHeight: 3.0,
      ceilingHeight: 2.7,
      roomVolume: 0,
      roomCount: 1,
      envelope: {
        rows: [],
      },
      indoorConditions: {
        indoorConditionCode: null,
        lightingCode: null,
        lightingType: null,
        occupancyCode: null,
        equipmentCode: null,
      },
      calculationConditions: {
        outdoorAirVolume: null,
        outdoorAirVolumePerArea: null,
        outdoorAirVolumePerPerson: null,
        ventilationCount: null,
        infiltrationMethod: null,
        infiltrationArea: null,
        windowType: null,
        airtightness: null,
        windSpeed: null,
        infiltrationVolume: null,
        occupancyDensity: null,
        occupancyCount: null,
        otherSensibleLoad: null,
        otherLatentLoad: null,
      },
      systemNotes: {
        systemId: null,
        systemName: null,
        notes: '',
      },
      createdAt: now,
      updatedAt: now,
    };

    try {
      addRoom(newRoom);
      await masterDataService.saveAllMasterData();
      setSelectedId(newRoom.id);
      setCurrentTab('basic');
      showSnackbar('新規室を追加しました', 'success');
    } catch (error) {
      console.error('Add error:', error);
      showSnackbar('追加に失敗しました', 'error');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as any),
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedId || !formData.roomName) {
      showSnackbar('室名を入力してください', 'error');
      return;
    }

    try {
      updateRoom(selectedId, formData);
      await masterDataService.saveAllMasterData();
      showSnackbar('保存しました', 'success');
    } catch (error) {
      console.error('Save error:', error);
      showSnackbar('保存に失敗しました', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!window.confirm('本当に削除しますか？')) return;

    try {
      deleteRoom(selectedId);
      await masterDataService.saveAllMasterData();
      setSelectedId(null);
      showSnackbar('削除しました', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      showSnackbar('削除に失敗しました', 'error');
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: RoomTab) => {
    setCurrentTab(newValue);
  };

  const roomListItems: RoomListItem[] = rooms.map((room) => ({
    id: room.id,
    floor: room.floor,
    roomNumber: room.roomNumber,
    roomName: room.roomName,
    floorArea: room.floorArea,
    systemName: room.systemNotes.systemName,
  }));

  const renderTabContent = () => {
    if (!selectedId) {
      return (
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" color="text.secondary">
            左のリストから室を選択するか、新規追加してください
          </Typography>
        </Box>
      );
    }

    switch (currentTab) {
      case 'basic':
        return <RoomBasicForm formData={formData} onChange={handleChange} />;

      case 'envelope':
        return (
          <EnvelopeTable
            rows={formData.envelope?.rows || []}
            onChange={(rows) => handleNestedChange('envelope', 'rows', rows)}
          />
        );

      case 'indoor':
        return (
          <RoomIndoorConditionsForm
            formData={
              formData.indoorConditions || {
                indoorConditionCode: null,
                lightingCode: null,
                lightingType: null,
                occupancyCode: null,
                equipmentCode: null,
              }
            }
            onChange={(field, value) => handleNestedChange('indoorConditions', field, value)}
          />
        );

      case 'calculation':
        return (
          <RoomCalculationConditionsForm
            formData={
              formData.calculationConditions || {
                outdoorAirVolume: null,
                outdoorAirVolumePerArea: null,
                outdoorAirVolumePerPerson: null,
                ventilationCount: null,
                infiltrationMethod: null,
                infiltrationArea: null,
                windowType: null,
                airtightness: null,
                windSpeed: null,
                infiltrationVolume: null,
                occupancyDensity: null,
                occupancyCount: null,
                otherSensibleLoad: null,
                otherLatentLoad: null,
              }
            }
            floorArea={formData.floorArea || 0}
            roomVolume={formData.roomVolume || 0}
            onChange={(field, value) => handleNestedChange('calculationConditions', field, value)}
          />
        );

      case 'system':
        return (
          <RoomSystemNotesForm
            formData={
              formData.systemNotes || {
                systemId: null,
                systemName: null,
                notes: '',
              }
            }
            onChange={(field, value) => handleNestedChange('systemNotes', field, value)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        室登録
      </Typography>

      <Paper sx={{ mt: 2, height: 'calc(100vh - 180px)', display: 'flex' }}>
        {/* Left: Room List */}
        <Box sx={{ width: '300px', minWidth: '300px' }}>
          <RoomList rooms={roomListItems} selectedId={selectedId} onSelect={setSelectedId} onAdd={handleAddRoom} />
        </Box>

        {/* Right: Room Details */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedId && (
            <>
              {/* Header with Save/Delete buttons */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6">
                  {formData.floor} {formData.roomNumber} {formData.roomName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>
                    削除
                  </Button>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
                    保存
                  </Button>
                </Box>
              </Box>

              {/* Tabs */}
              <Tabs value={currentTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="基本情報" value="basic" />
                <Tab label="構造体" value="envelope" />
                <Tab label="室内条件" value="indoor" />
                <Tab label="計算条件" value="calculation" />
                <Tab label="系統・備考" value="system" />
              </Tabs>

              {/* Tab Content */}
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>{renderTabContent()}</Box>
            </>
          )}

          {!selectedId && renderTabContent()}
        </Box>
      </Paper>
    </Box>
  );
};
