import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listProductCategories, deleteProductCategory, type ProductCategory } from '@/services/cmsApi';
import { Box, Button, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography, Switch, FormControlLabel } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/common/ToastProvider';

export function ProductCategoriesListPage() {
  const { data: categories = [], isLoading } = useQuery({ 
    queryKey: ['product-categories'], 
    queryFn: () => listProductCategories(false) 
  });
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProductCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      showToast('Категория удалена', 'success');
    },
    onError: (e: any) => showToast(e?.message || 'Ошибка удаления', 'error'),
  });

  if (isLoading) {
    return <Typography>Загрузка...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Категории товаров</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/product-categories/new')}
        >
          Добавить категорию
        </Button>
      </Box>

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell>Активна</TableCell>
              <TableCell>Порядок</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category: ProductCategory) => (
              <TableRow key={category.id} hover>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell>{category.description || '-'}</TableCell>
                <TableCell>
                  <FormControlLabel
                    control={<Switch checked={category.isActive} disabled />}
                    label=""
                  />
                </TableCell>
                <TableCell>{category.sortOrder}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => navigate(`/admin/product-categories/${category.id}`)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => {
                      if (window.confirm(`Удалить категорию "${category.name}"?`)) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">Категории не найдены</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
