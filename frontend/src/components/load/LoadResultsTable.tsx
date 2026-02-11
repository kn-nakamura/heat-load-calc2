// Load results table component

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import { useState } from 'react';
import { RoomLoadResult } from '../../types/system';

interface LoadResultsTableProps {
  roomLoads: RoomLoadResult[];
}

const formatLoad = (value: number): string => {
  return value.toFixed(0);
};

export const LoadResultsTable: React.FC<LoadResultsTableProps> = ({ roomLoads }) => {
  const [season, setSeason] = useState<'summer' | 'winter'>('summer');

  const handleSeasonChange = (_event: React.SyntheticEvent, newValue: 'summer' | 'winter') => {
    setSeason(newValue);
  };

  if (roomLoads.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary" align="center">
          計算結果がありません
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={season} onChange={handleSeasonChange}>
          <Tab label="夏期冷房負荷" value="summer" />
          <Tab label="冬期暖房負荷" value="winter" />
        </Tabs>
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow>
              <TableCell rowSpan={2}>室名</TableCell>
              <TableCell rowSpan={2}>階</TableCell>
              <TableCell align="center" colSpan={2}>
                構造体
              </TableCell>
              <TableCell align="center" colSpan={4}>
                内部発熱
              </TableCell>
              <TableCell align="center" colSpan={4}>
                換気
              </TableCell>
              <TableCell align="center" colSpan={3}>
                合計
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell align="right">壁体</TableCell>
              {season === 'summer' && <TableCell align="right">日射</TableCell>}
              {season === 'winter' && <TableCell align="right">-</TableCell>}
              <TableCell align="right">照明</TableCell>
              <TableCell align="right">人体(SH)</TableCell>
              <TableCell align="right">人体(LH)</TableCell>
              <TableCell align="right">機器</TableCell>
              <TableCell align="right">外気(SH)</TableCell>
              <TableCell align="right">外気(LH)</TableCell>
              <TableCell align="right">隙間(SH)</TableCell>
              <TableCell align="right">隙間(LH)</TableCell>
              <TableCell align="right">顕熱</TableCell>
              <TableCell align="right">潜熱</TableCell>
              <TableCell align="right">全熱</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roomLoads.map((room) => {
              const data = season === 'summer' ? room.summer : room.winter;
              return (
                <TableRow key={room.roomId} hover>
                  <TableCell>{room.roomName}</TableCell>
                  <TableCell>{room.floor}</TableCell>
                  <TableCell align="right">{formatLoad(data.envelopeLoad)}</TableCell>
                  <TableCell align="right">{season === 'summer' ? formatLoad(room.summer.solarLoad) : '-'}</TableCell>
                  <TableCell align="right">{formatLoad(data.lightingLoad)}</TableCell>
                  <TableCell align="right">{formatLoad(data.occupancySensibleLoad)}</TableCell>
                  <TableCell align="right">{formatLoad(data.occupancyLatentLoad)}</TableCell>
                  <TableCell align="right">{formatLoad(data.equipmentLoad)}</TableCell>
                  <TableCell align="right">{formatLoad(data.outdoorAirSensibleLoad)}</TableCell>
                  <TableCell align="right">{formatLoad(data.outdoorAirLatentLoad)}</TableCell>
                  <TableCell align="right">{formatLoad(data.infiltrationSensibleLoad)}</TableCell>
                  <TableCell align="right">{formatLoad(data.infiltrationLatentLoad)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatLoad(data.totalSensibleLoad)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatLoad(data.totalLatentLoad)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>
                    {formatLoad(data.totalLoad)}
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Totals row */}
            <TableRow sx={{ bgcolor: 'action.selected' }}>
              <TableCell colSpan={2}>
                <strong>合計</strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {formatLoad(roomLoads.reduce((sum, r) => sum + (season === 'summer' ? r.summer : r.winter).envelopeLoad, 0))}
                </strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {season === 'summer'
                    ? formatLoad(roomLoads.reduce((sum, r) => sum + r.summer.solarLoad, 0))
                    : '-'}
                </strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {formatLoad(roomLoads.reduce((sum, r) => sum + (season === 'summer' ? r.summer : r.winter).lightingLoad, 0))}
                </strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {formatLoad(
                    roomLoads.reduce((sum, r) => sum + (season === 'summer' ? r.summer : r.winter).occupancySensibleLoad, 0)
                  )}
                </strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {formatLoad(
                    roomLoads.reduce((sum, r) => sum + (season === 'summer' ? r.summer : r.winter).occupancyLatentLoad, 0)
                  )}
                </strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {formatLoad(roomLoads.reduce((sum, r) => sum + (season === 'summer' ? r.summer : r.winter).equipmentLoad, 0))}
                </strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {formatLoad(
                    roomLoads.reduce((sum, r) => sum + (season === 'summer' ? r.summer : r.winter).outdoorAirSensibleLoad, 0)
                  )}
                </strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {formatLoad(
                    roomLoads.reduce((sum, r) => sum + (season === 'summer' ? r.summer : r.winter).outdoorAirLatentLoad, 0)
                  )}
                </strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {formatLoad(
                    roomLoads.reduce((sum, r) => sum + (season === 'summer' ? r.summer : r.winter).infiltrationSensibleLoad, 0)
                  )}
                </strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {formatLoad(
                    roomLoads.reduce((sum, r) => sum + (season === 'summer' ? r.summer : r.winter).infiltrationLatentLoad, 0)
                  )}
                </strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {formatLoad(
                    roomLoads.reduce((sum, r) => sum + (season === 'summer' ? r.summer : r.winter).totalSensibleLoad, 0)
                  )}
                </strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {formatLoad(
                    roomLoads.reduce((sum, r) => sum + (season === 'summer' ? r.summer : r.winter).totalLatentLoad, 0)
                  )}
                </strong>
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: 'action.hover' }}>
                <strong>
                  {formatLoad(roomLoads.reduce((sum, r) => sum + (season === 'summer' ? r.summer : r.winter).totalLoad, 0))}
                </strong>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          ※ 単位: W (ワット) | SH: 顕熱, LH: 潜熱
        </Typography>
      </Box>
    </Box>
  );
};
