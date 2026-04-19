import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function SimpleDateRangePicker({ date, setDate }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date-from"
            variant={"outline"}
            className="w-full sm:w-auto flex-1 justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? format(date.from, "dd/MM/yyyy", { locale: ptBR }) : <span>Data inicial</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date?.from}
            onSelect={(selectedDate) => setDate({ ...date, from: selectedDate })}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
      <span className="text-slate-500">-</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date-to"
            variant={"outline"}
            className="w-full sm:w-auto flex-1 justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.to ? format(date.to, "dd/MM/yyyy", { locale: ptBR }) : <span>Data final</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date?.to}
            onSelect={(selectedDate) => setDate({ ...date, to: selectedDate })}
            initialFocus
            locale={ptBR}
            disabled={(d) => date?.from && d < date.from}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}