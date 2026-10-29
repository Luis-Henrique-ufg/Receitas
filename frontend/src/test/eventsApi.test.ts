import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { eventsApi } from "@/services/eventsApi";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

describe("eventsApi service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches all events with query parameters", async () => {
    const mockEvents = [
      {
        id: 1,
        title: "Prova de Estatística",
        date: "2026-11-20",
        time: "14:00",
        category: "prova" as const,
        done: false,
      },
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: mockEvents });

    const result = await eventsApi.getAll("http://localhost:9823", {
      month: "2026-11",
      upcoming: 5,
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "http://localhost:9823/api/events?month=2026-11&upcoming=5"
    );
    expect(result).toEqual(mockEvents);
  });

  it("creates a new event", async () => {
    const newEvent = {
      title: "Entrega do Projeto",
      date: "2026-11-25",
      category: "entrega" as const,
    };

    mockedAxios.post.mockResolvedValueOnce({
      data: { id: 2, ...newEvent, done: false },
    });

    const result = await eventsApi.create("http://localhost:9823", newEvent);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "http://localhost:9823/api/events",
      newEvent
    );
    expect(result.id).toBe(2);
  });

  it("toggles event done status", async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      data: { id: 1, done: true },
    });

    const result = await eventsApi.toggleDone("http://localhost:9823", 1);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      "http://localhost:9823/api/events/1/toggle-done"
    );
    expect(result.done).toBe(true);
  });

  it("generates correct .ics export URL", () => {
    const url = eventsApi.getExportIcsUrl("http://localhost:9823", {
      month: "2026-11",
      course_id: 3,
      subject_id: 5,
    });

    expect(url).toBe(
      "http://localhost:9823/api/events/export.ics?month=2026-11&subject_id=5&course_id=3"
    );
  });
});
