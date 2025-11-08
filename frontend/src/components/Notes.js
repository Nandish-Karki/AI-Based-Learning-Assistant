import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, CircularProgress, Alert, List, ListItem, ListItemText, Paper } from '@mui/material';
import axios from 'axios';

const Notes = ({ documentId, chapter, userEmail }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState('');

  useEffect(() => {
    if (!documentId || chapter === null) return;

    const fetchNotes = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await axios.get(`http://localhost:8000/upload/notes/${documentId}/${chapter}`, {
          params: { user_email: userEmail },
          headers: headers,
        });
        setNotes(response.data.notes);
      } catch (err) {
        setError('Failed to fetch notes.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [documentId, userEmail, chapter]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setPostLoading(true);
    setPostError('');
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await axios.post(`http://localhost:8000/upload/notes/${documentId}/${chapter}`, {
        document_id: documentId,
        chapter: chapter,
        note: newNote,
        user_email: userEmail,
      }, { headers });
      setNotes([...notes, newNote]);
      setNewNote('');
    } catch (err) {
      setPostError('Failed to add note.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ mt: 4, p: 3 }}>
      <Typography variant="h5" gutterBottom>Notes for Module {chapter}</Typography>
      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
        <List>
          {notes.map((note, index) => (
            <ListItem key={index}>
              <ListItemText primary={note} />
            </ListItem>
          ))}
        </List>
      )}
      <Box sx={{ mt: 2 }}>
        <TextField
          label="Add a new note"
          variant="outlined"
          fullWidth
          multiline
          rows={3}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />
        <Button
          variant="contained"
          onClick={handleAddNote}
          disabled={postLoading}
          sx={{ mt: 2 }}
        >
          {postLoading ? <CircularProgress size={24} /> : 'Add Note'}
        </Button>
        {postError && <Alert severity="error" sx={{ mt: 2 }}>{postError}</Alert>}
      </Box>
    </Paper>
  );
};

export default Notes;
