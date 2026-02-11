// Load summary card component

import { Card, CardContent, Typography, Box, Chip, Stack } from '@mui/material';
import { SystemLoadResult } from '../../types/system';

interface LoadSummaryCardProps {
  systemLoad: SystemLoadResult;
}

const formatLoad = (value: number): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} kW`;
  }
  return `${value.toFixed(0)} W`;
};

const formatAirVolume = (value: number): string => {
  return `${value.toFixed(0)} m³/h`;
};

export const LoadSummaryCard: React.FC<LoadSummaryCardProps> = ({ systemLoad }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            {systemLoad.systemName}
          </Typography>
          <Chip label={`${systemLoad.roomCount} 室`} color="primary" size="small" />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {/* Summer Cooling Loads */}
          <Box sx={{ flex: '1 1 300px', p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'error.contrastText' }}>
              夏期冷房負荷
            </Typography>
            <Stack spacing={0.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'error.contrastText' }}>
                  顕熱負荷:
                </Typography>
                <Typography variant="body2" sx={{ color: 'error.contrastText', fontWeight: 'bold' }}>
                  {formatLoad(systemLoad.summerSensibleLoad)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'error.contrastText' }}>
                  潜熱負荷:
                </Typography>
                <Typography variant="body2" sx={{ color: 'error.contrastText', fontWeight: 'bold' }}>
                  {formatLoad(systemLoad.summerLatentLoad)}
                </Typography>
              </Box>
              <Box sx={{ borderTop: '1px solid', borderColor: 'error.contrastText', my: 0.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" sx={{ color: 'error.contrastText' }}>
                  全熱負荷:
                </Typography>
                <Typography variant="subtitle2" sx={{ color: 'error.contrastText', fontWeight: 'bold' }}>
                  {formatLoad(systemLoad.summerTotalLoad)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Winter Heating Loads */}
          <Box sx={{ flex: '1 1 300px', p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'info.contrastText' }}>
              冬期暖房負荷
            </Typography>
            <Stack spacing={0.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'info.contrastText' }}>
                  顕熱負荷:
                </Typography>
                <Typography variant="body2" sx={{ color: 'info.contrastText', fontWeight: 'bold' }}>
                  {formatLoad(systemLoad.winterSensibleLoad)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'info.contrastText' }}>
                  潜熱負荷:
                </Typography>
                <Typography variant="body2" sx={{ color: 'info.contrastText', fontWeight: 'bold' }}>
                  {formatLoad(systemLoad.winterLatentLoad)}
                </Typography>
              </Box>
              <Box sx={{ borderTop: '1px solid', borderColor: 'info.contrastText', my: 0.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" sx={{ color: 'info.contrastText' }}>
                  全熱負荷:
                </Typography>
                <Typography variant="subtitle2" sx={{ color: 'info.contrastText', fontWeight: 'bold' }}>
                  {formatLoad(systemLoad.winterTotalLoad)}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* Air Volumes */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                外気量:
              </Typography>
              <Typography variant="h6">{formatAirVolume(systemLoad.outdoorAirVolume)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                排気量:
              </Typography>
              <Typography variant="h6">{formatAirVolume(systemLoad.exhaustAirVolume)}</Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
