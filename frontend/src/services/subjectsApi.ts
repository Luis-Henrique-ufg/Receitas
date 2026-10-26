import axios from "axios";
import { Subject } from "@/models/models";

function resolveUrl(apiUrl?: string, path: string = ""): string {
  const base = (apiUrl || "").replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export const subjectsApi = {
  async getAll(apiUrl?: string, includeArchived: boolean = false): Promise<Subject[]> {
    const url = resolveUrl(
      apiUrl,
      `/api/subjects?include_archived=${includeArchived}`
    );
    const res = await axios.get<Subject[]>(url);
    return res.data;
  },

  async getById(apiUrl: string | undefined, id: number): Promise<Subject> {
    const url = resolveUrl(apiUrl, `/api/subjects/${id}`);
    const res = await axios.get<Subject>(url);
    return res.data;
  },

  async create(
    apiUrl: string | undefined,
    data: { name: string; color: string; code?: string; semester?: string }
  ): Promise<Subject> {
    const url = resolveUrl(apiUrl, "/api/subjects");
    const res = await axios.post<Subject>(url, data);
    return res.data;
  },

  async update(
    apiUrl: string | undefined,
    id: number,
    data: Partial<Subject>
  ): Promise<Subject> {
    const url = resolveUrl(apiUrl, `/api/subjects/${id}`);
    const res = await axios.put<Subject>(url, data);
    return res.data;
  },

  async archive(
    apiUrl: string | undefined,
    id: number,
    archive: boolean = true
  ): Promise<Subject> {
    const url = resolveUrl(apiUrl, `/api/subjects/${id}/archive`);
    const res = await axios.patch<Subject>(url, { archive });
    return res.data;
  },

  async delete(apiUrl: string | undefined, id: number): Promise<void> {
    const url = resolveUrl(apiUrl, `/api/subjects/${id}`);
    await axios.delete(url);
  },
};
