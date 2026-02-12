// Address search form using Nominatim API

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search as SearchIcon, MyLocation as MyLocationIcon } from '@mui/icons-material';
import { searchAddress, formatAddress, extractLocationName, NominatimSearchResult } from '../../services/addressSearch';

interface AddressSearchFormProps {
  onAddressSelect: (result: NominatimSearchResult) => void;
}

export const AddressSearchForm: React.FC<AddressSearchFormProps> = ({ onAddressSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('検索キーワードを入力してください');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const results = await searchAddress(searchQuery);

      if (results.length === 0) {
        setError('該当する住所が見つかりませんでした。別のキーワードで検索してください。');
        setSearchResults([]);
      } else {
        setSearchResults(results);
        setError(null);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('検索中にエラーが発生しました。時間をおいて再度お試しください。');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectResult = (result: NominatimSearchResult) => {
    onAddressSelect(result);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsSearching(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Create a pseudo result with current location
          const result: NominatimSearchResult = {
            place_id: 0,
            licence: '',
            osm_type: '',
            osm_id: 0,
            boundingbox: [],
            lat: latitude.toString(),
            lon: longitude.toString(),
            display_name: '現在地',
            class: '',
            type: '',
            importance: 0,
            address: {},
          };
          onAddressSelect(result);
          setIsSearching(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('現在地の取得に失敗しました。ブラウザの位置情報を許可してください。');
          setIsSearching(false);
        }
      );
    } else {
      setError('このブラウザは位置情報をサポートしていません。');
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        住所検索
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        住所を検索して、緯度経度と地域区分を自動設定します
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="例: 東京都渋谷区、大阪市北区、札幌市"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSearching}
        />
        <Button
          variant="contained"
          startIcon={isSearching ? <CircularProgress size={16} /> : <SearchIcon />}
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
        >
          検索
        </Button>
        <Button
          variant="outlined"
          startIcon={<MyLocationIcon />}
          onClick={handleCurrentLocation}
          disabled={isSearching}
          title="現在地を使用"
        >
          現在地
        </Button>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {searchResults.length > 0 && (
        <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
          <List dense>
            {searchResults.map((result) => (
              <ListItem key={result.place_id} disablePadding>
                <ListItemButton onClick={() => handleSelectResult(result)}>
                  <ListItemText
                    primary={result.display_name}
                    secondary={`緯度: ${parseFloat(result.lat).toFixed(4)}, 経度: ${parseFloat(result.lon).toFixed(
                      4
                    )}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        ※ OpenStreetMap の Nominatim API を使用しています
      </Typography>
    </Box>
  );
};
