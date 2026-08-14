"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { Field } from "@/components/primitives/Field";
import { Select } from "@/components/primitives/Select";
import { Toggle } from "@/components/primitives/Toggle";
import { RangeSlider } from "@/components/primitives/RangeSlider";
import { Modal } from "@/components/primitives/Modal";
import { Sheet } from "@/components/primitives/Sheet";
import { useToast } from "@/components/primitives/Toast";
import { usePrefs } from "@/components/primitives/PrefsProvider";
import {
  formatAED,
  formatConverted,
  conversionNote,
} from "@/lib/currency";
import { formatArea } from "@/lib/units";

export function StyleguideDemos() {
  const [toggleOn, setToggleOn] = useState(true);
  const [range, setRange] = useState({ min: 900_000, max: 4_200_000 });
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();
  const { currency, unit } = usePrefs();

  const samplePriceAED = 1_600_000;
  const sampleSqft = 1240;
  const converted = formatConverted(samplePriceAED, currency);
  const note = conversionNote(currency);

  return (
    <div className="flex flex-col gap-12">
      {/* Forms */}
      <div className="grid max-w-2xl gap-6 sm:grid-cols-2">
        <Field
          id="sg-name"
          label="Full name"
          placeholder="As it appears on your passport"
        />
        <Field
          id="sg-email"
          label="Email"
          type="email"
          hint="We reply from a named consultant."
        />
        <Field
          id="sg-budget"
          label="Budget"
          defaultValue="AED 2,400,000"
          error="Enter a number, without commas."
        />
        <Select
          id="sg-residency"
          label="Residency status"
          options={[
            { value: "non-resident", label: "Non-resident" },
            { value: "resident", label: "UAE resident" },
            { value: "national", label: "UAE national" },
          ]}
        />
        <Toggle
          id="sg-toggle"
          checked={toggleOn}
          onChange={setToggleOn}
          label="Post-handover payment plans only"
        />
        <RangeSlider
          label="Price range"
          min={500_000}
          max={10_000_000}
          step={100_000}
          valueMin={range.min}
          valueMax={range.max}
          onChange={setRange}
          format={(v) => `${(v / 1_000_000).toFixed(1)}M`}
        />
      </div>

      {/* Overlays */}
      <div className="flex flex-wrap gap-4">
        <Button variant="secondary" onClick={() => setModalOpen(true)}>
          Open modal
        </Button>
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>
          Open sheet
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast("Saved. A consultant will reply within one working day.")}
        >
          Show toast
        </Button>
      </div>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Request the brochure"
      >
        <p>
          Results stay on screen. Emailing the breakdown as a PDF is the only
          gated step — that is the lead.
        </p>
      </Modal>
      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
      >
        <p className="type-body text-navy/80">
          Mobile filter controls render here. Body scroll locks while open.
        </p>
      </Sheet>

      {/* Currency + units, driven by the live switchers in the header */}
      <div className="flex flex-col gap-2 border border-rule bg-surface p-6">
        <p className="type-eyebrow text-navy/80">
          Live price display · currency {currency} · {unit}
        </p>
        <p className="type-display-m text-navy">
          {formatAED(samplePriceAED)}
          {converted ? (
            <span className="type-body-l ms-3 text-navy/80">{converted}</span>
          ) : null}
        </p>
        <p className="type-body-s text-navy/80">
          {formatArea(sampleSqft, unit)}
        </p>
        {note ? <p className="type-micro text-navy/80">{note}</p> : null}
        <p className="type-micro text-navy/80">
          AED is the contractual currency and is always shown. Seed rates —
          replaced by a daily cached fetch in Phase 5.
        </p>
      </div>
    </div>
  );
}
