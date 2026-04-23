import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listAuthors, deleteAuthor, type Author } from '@/services/cmsApi';
import { Box, Button, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography, Switch, FormControlLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useToast } from '@/components/common/ToastProvider';

export function AuthorsListPage() {
  const { data: authors = [], isLoading } = useQuery({ queryKey: ['authors'], queryFn: () => listAuthors(false) });
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => deleteAuthor(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      showToast('Автор удален', 'success');
    },
    onError: (e: any) => showToast(e?.message || 'Ошибка удаления', 'error'),
  });

  if (isLoading) {
    return <Typography>Загрузка...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Авторы</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/authors/new')}
        >
          Добавить автора
        </Button>
      </Box>

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Имя</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell>Активен</TableCell>
              <TableCell>Порядок</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {authors.map((author: Author) => (
              <TableRow key={author.id} hover>
                <TableCell>{author.name}</TableCell>
                <TableCell>{author.slug}</TableCell>
                <TableCell>{author.description || '-'}</TableCell>
                <TableCell>
                  <FormControlLabel
                    control={<Switch checked={author.isActive} disabled />}
                    label=""
                  />
                </TableCell>
                <TableCell>{author.sortOrder}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => navigate(`/admin/authors/${author.slug}`)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => {
                      if (window.confirm(`Удалить автора "${author.name}"?`)) {
                        deleteMutation.mutate(author.slug);
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {authors.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">Авторы не найдены</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
