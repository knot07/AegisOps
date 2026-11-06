"""Read-only AegisOps WebUI access contract for TDP V2 summaries."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from aegisops.contracts.access.models import (
    Binding,
    Contract,
    ContractOperation,
    DriverResult,
    InternalDataRow,
    RuntimeContext,
    WebUIContractPlugin,
)


PAGE_ID = "ai"
CONTRACT_ID = "datang.tdp.operations"
CONTRACT_VERSION = "1.0"
FIELDS = frozenset(
    {
        "id",
        "range_key",
        "ip",
        "count",
        "first_time",
        "last_time",
        "time",
        "percent",
        "is_cdn",
        "is_exit",
    }
)


def _database_path() -> Path:
    override = os.getenv("DATANG_TDP_V2_DB")
    return Path(override).expanduser() if override else Path.home() / ".aegisops" / "data" / "datang_tdp_v2.db"


def _contract() -> Contract:
    return Contract(
        contract_id=CONTRACT_ID,
        version=CONTRACT_VERSION,
        page_id=PAGE_ID,
        operations={
            "list": ContractOperation(
                name="list",
                operation_type="query",
                adapter_required_fields=FIELDS,
                identity_fields=frozenset({"id"}),
                public_fields=frozenset({"source", "summary", "rows"}),
                filter_fields=frozenset({"range_key", "ip"}),
                filter_param_fields={"range_key": "range_key", "ip": "ip"},
                cursor_fields=frozenset({"last_time", "id"}),
                sort_fields=frozenset({"last_time", "id"}),
                default_limit=100,
                max_limit=1000,
            )
        },
    )


class _BindingResolver:
    def resolve(self, *, page_id: str, slot_id: str, contract_id: str, contract_version: str) -> Binding:
        database = _database_path()
        return Binding(
            binding_id="datang-tdp-v2-sqlite",
            binding_version=1,
            page_id=page_id,
            slot_id=slot_id,
            contract_id=contract_id,
            contract_version=contract_version,
            adapter_kind="builtin-sqlite-json",
            source_page_id=PAGE_ID,
            source_root=database,
            driver_available_fields=FIELDS,
            driver_allowlist_roots=(database.parent,),
            driver_options={
                "table": "tdp_ip_summaries",
                "recordColumn": "record_json",
                "dateColumn": "range_key",
                "eventTimeColumn": "last_time",
            },
            predicate_value_resolver=lambda record, field: record.get(field),
            capabilities=frozenset({"query"}),
        )


class _Adapter:
    def normalize(self, driver_result: DriverResult) -> list[InternalDataRow]:
        return [
            InternalDataRow(
                raw=record,
                identity={"entityType": "datang-tdp-ip", "entityId": record["id"]},
            )
            for record in driver_result.rows
            if record.get("id")
        ]


class _ResponsePipeline:
    def run_query(
        self,
        *,
        context: RuntimeContext,
        binding_source_page_id: str,
        driver_result: DriverResult,
        rows: list[InternalDataRow],
        filter_stages_applied: list[dict[str, str]],
    ) -> dict[str, Any]:
        del context
        return {
            "schemaVersion": "datang.tdp.v2",
            "source": {
                "pageId": binding_source_page_id,
                "dataSource": "sqlite",
                "readOnly": True,
            },
            "summary": {
                "totalRaw": driver_result.total_raw,
                "totalUnique": driver_result.total_unique,
                "duplicates": driver_result.duplicates,
                "filteredUnique": driver_result.filtered_unique,
                "parseErrors": driver_result.parse_errors,
                "filterStagesApplied": filter_stages_applied,
            },
            "rows": [row.raw for row in rows],
        }


CONTRACTS = (
    WebUIContractPlugin(
        plugin_id="datang-tdp-v2-operations",
        contracts=(_contract(),),
        binding_resolver=_BindingResolver(),
        adapter=_Adapter(),
        response_pipeline=_ResponsePipeline(),
        version=CONTRACT_VERSION,
    ),
)
