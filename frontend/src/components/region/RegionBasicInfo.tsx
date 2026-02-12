// Region basic information display (地域基本情報)

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Typography,
  Box,
} from '@mui/material';

interface RegionBasicInfoProps {
  region: string;
  solarRegion?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  orientationBasis?: string;
  orientationAngle?: number;
}

export const RegionBasicInfo: React.FC<RegionBasicInfoProps> = ({
  region,
  solarRegion,
  city,
  latitude,
  longitude,
  orientationBasis,
  orientationAngle,
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        地域基本情報
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>地域区分</TableCell>
              <TableCell>{region || '未設定'}</TableCell>
            </TableRow>
            {solarRegion && (
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>日射地域区分</TableCell>
                <TableCell>{solarRegion}</TableCell>
              </TableRow>
            )}
            {city && (
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>地点</TableCell>
                <TableCell>{city}</TableCell>
              </TableRow>
            )}
            {latitude != null && longitude != null && (
              <>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>緯度</TableCell>
                  <TableCell>{latitude.toFixed(6)}°</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>経度</TableCell>
                  <TableCell>{longitude.toFixed(6)}°</TableCell>
                </TableRow>
              </>
            )}
            {orientationBasis && (
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>方位基準</TableCell>
                <TableCell>{orientationBasis}</TableCell>
              </TableRow>
            )}
            {orientationAngle != null && (
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>方位角度</TableCell>
                <TableCell>{orientationAngle}°</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
