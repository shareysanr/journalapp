import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../api";
import EntryForm, { type Entry } from "../components/EntryForm";

type EntryResponse = {
  data: Entry;
};

export default function EditEntryPage() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEntry() {
      setLoading(true);
      setError(null);

      try {
        const response = await apiRequest<EntryResponse>(`/api/v1/entries/${entryId}`, {
          auth: true
        });
        setEntry(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load entry");
      } finally {
        setLoading(false);
      }
    }

    if (entryId) {
      void loadEntry();
    }
  }, [entryId]);

  if (loading) {
    return <p className="text-sm text-slate-600">Loading entry...</p>;
  }

  if (error || !entry) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error ?? "Entry not found"}
      </div>
    );
  }

  return (
    <EntryForm
      entryId={entry.id}
      initialValues={entry}
      onSaved={() => navigate("/entries")}
    />
  );
}
