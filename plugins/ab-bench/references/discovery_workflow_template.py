"""
Oracle-Guided Discovery Loop Template for Antigravity `run_workflow`.

Coordinates multi-wave divergent mutation (Phase 1), isolated worktree prototyping
(Phase 2), 4-oracle filtering + blind evaluation (Phase 3), and a 5-condition
composite stop gate (`evaluateStopCondition`) without touching `main`.
"""

import json
import subprocess
import time
from pathlib import Path

repo_root = Path(WORKSPACES[0]) if WORKSPACES else Path.cwd()
local_cli = repo_root / "plugins" / "ab-bench" / "scripts" / "discovery.mjs"
global_cli = Path.home() / ".gemini" / "config" / "plugins" / "ab-bench" / "scripts" / "discovery.mjs"
discovery_cli = local_cli if local_cli.exists() else global_cli

brief_path = Path(args["brief_path"])
output_dir = Path(args["output_dir"])
output_dir.mkdir(parents=True, exist_ok=True)

mutator_model = args.get("mutator_model", "flash")
builder_model = args.get("builder_model", "inherit")
judge_model = args.get("judge_model", "inherit")
dry_run_builders = bool(args.get("dry_run_builders", False))

brief = json.loads(brief_path.read_text(encoding="utf-8"))
stop_policy = brief.get("stopPolicy", {})
target_scope = ", ".join(brief.get("targetScope", []))
goal = brief.get("goal", "")


def run_discovery_cli(cli_args):
    proc = subprocess.run(
        ["node", str(discovery_cli), *cli_args],
        cwd=str(repo_root),
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(proc.stdout)


async def safe_run_agent(prompt, schema, role, type_name="research", workspace="inherit", model=None):
    try:
        res = await agent(
            prompt=prompt,
            schema=schema,
            role=role,
            type_name=type_name,
            workspace=workspace,
            model=model,
        )
        return {"status": "OK", "data": res}
    except Exception as exc:
        return {"status": "ERROR", "error": str(exc)}


HYPOTHESIS_SCHEMA = {
    "type": "object",
    "properties": {
        "hypotheses": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "title": {"type": "string"},
                    "claim": {"type": "string"},
                    "targetFile": {"type": "string"},
                    "expectedGain": {"type": "string"},
                    "falsificationTest": {"type": "string"},
                },
                "required": ["id", "title", "claim", "targetFile", "expectedGain", "falsificationTest"],
            },
        }
    },
    "required": ["hypotheses"],
}

PROTOTYPE_SCHEMA = {
    "type": "object",
    "properties": {
        "implemented": {"type": "boolean"},
        "worktreeBranch": {"type": "string"},
        "summary": {"type": "string"},
        "diffSummary": {"type": "string"},
        "empiricalScore": {"type": "number"},
        "invarianceRate": {"type": "number"},
        "complexityCost": {"type": "number"},
        "testsPassed": {"type": "boolean"},
        "probeViolations": {"type": "integer"},
        "diffTamperCount": {"type": "integer"},
        "invarianceFailures": {"type": "integer"},
        "empiricalPassed": {"type": "boolean"},
        "empiricalReason": {"type": "string"},
    },
    "required": [
        "implemented",
        "summary",
        "diffSummary",
        "empiricalScore",
        "invarianceRate",
        "complexityCost",
        "testsPassed",
        "empiricalPassed",
    ],
}

COGNITIVE_ORACLE_SCHEMA = {
    "type": "object",
    "properties": {
        "evaluations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "blindLabel": {"type": "string"},
                    "passed": {"type": "boolean"},
                    "cognitiveScore": {"type": "number"},
                    "reason": {"type": "string"},
                },
                "required": ["blindLabel", "passed", "cognitiveScore", "reason"],
            },
        }
    },
    "required": ["evaluations"],
}

FIVE_FINGER_JUDGE_SCHEMA = {
    "type": "object",
    "properties": {
        "evaluations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "blindLabel": {"type": "string"},
                    "fingers": {
                        "type": "array",
                        "items": {"type": "integer"},
                    },
                    "rationale": {"type": "string"},
                },
                "required": ["blindLabel", "fingers", "rationale"],
            },
        }
    },
    "required": ["evaluations"],
}

start_ms = int(time.time() * 1000)
run_state = {
    "wavesCompleted": 0,
    "variantsPrototyped": 0,
    "subagentCalls": 0,
    "totalTokens": 0,
    "elapsedMs": 0,
    "consecutiveStagnantWaves": 0,
    "consecutiveZeroYieldWaves": 0,
    "satisficingOrthogonalCount": 0,
    "lastWaveDuplicateRate": 0.0,
    "lastWaveHypothesisCount": 0,
}

prior_hypotheses = []
all_variants = []
best_frontier_delta = 0.0
latest_reveal_map = {}

state_file = output_dir / "run-state.json"
hyp_file = output_dir / "wave-hypotheses.json"
prior_file = output_dir / "prior-hypotheses.json"
variants_file = output_dir / "variants.json"
batch_file = output_dir / "blind-batch.json"
verdict_file = output_dir / "discovery-verdict.json"
report_file = output_dir / "discovery-report.md"

max_waves = int(stop_policy.get("maxWaves", 4))
max_variants = int(stop_policy.get("maxVariants", 8))
min_improvement_delta = float(stop_policy.get("minImprovementDelta", 0.05))
target_baseline_margin = float(stop_policy.get("targetBaselineMargin", 0.10))

for wave in range(1, max_waves + 1):
    run_state["elapsedMs"] = int(time.time() * 1000) - start_ms
    state_file.write_text(json.dumps(run_state, indent=2), encoding="utf-8")
    stop_check = run_discovery_cli(["--check-stop", "--brief", str(brief_path), "--state", str(state_file)])
    if stop_check.get("shouldStop"):
        log(f"Stopping before wave {wave}: {stop_check.get('exitReason')}")
        break

    phase(f"Wave {wave} - Mutation & Attack")
    mutators = brief.get("mutators", [])

    async def run_mutator(m):
        prompt = (
            f"You are mutator '{m['id']}' ({m['labelIt']}).\n"
            f"Mechanism: {m['mechanism']}\n"
            f"Goal: {goal}\n"
            f"Target scope: {target_scope}\n"
            f"Propose 1 concrete, falsifiable improvement hypothesis targeting a real file in scope. "
            f"Do NOT modify files. Keep claims concise and measurable."
        )
        return await safe_run_agent(
            prompt=prompt,
            schema=HYPOTHESIS_SCHEMA,
            role=f"Wave {wave} Mutator {m['id']}",
            type_name="research",
            workspace="inherit",
            model=mutator_model,
        )

    mutator_results = await parallel(mutators, run_mutator)
    run_state["subagentCalls"] += len(mutators)

    raw_hypotheses = []
    for idx, res in enumerate(mutator_results):
        arch = mutators[idx]["id"]
        if res.get("status") != "OK":
            log(f"Mutator {arch} failed safely: {res.get('error')}")
            continue
        for h_idx, h in enumerate(res["data"].get("hypotheses", [])):
            raw_hypotheses.append({
                **h,
                "id": h.get("id") or f"w{wave}-{arch}-{h_idx + 1}",
                "mutatorArchetype": arch,
            })

    hyp_file.write_text(json.dumps(raw_hypotheses, indent=2), encoding="utf-8")
    prior_file.write_text(json.dumps(prior_hypotheses, indent=2), encoding="utf-8")
    dedupe_res = run_discovery_cli([
        "--dedupe",
        "--hypotheses", str(hyp_file),
        "--prior", str(prior_file),
        "--max-duplicate-rate", str(stop_policy.get("maxDuplicateRate", 0.7)),
    ])
    run_state["lastWaveHypothesisCount"] = dedupe_res.get("total", 0)
    run_state["lastWaveDuplicateRate"] = dedupe_res.get("duplicateRate", 0.0)

    remaining_variant_slots = max(0, max_variants - len(all_variants))
    accepted_hypotheses = dedupe_res.get("uniqueHypotheses", [])[:remaining_variant_slots]
    prior_hypotheses.extend(accepted_hypotheses)

    if not accepted_hypotheses:
        run_state["wavesCompleted"] += 1
        run_state["consecutiveZeroYieldWaves"] += 1
        run_state["consecutiveStagnantWaves"] += 1
        continue

    phase(f"Wave {wave} - Isolated Worktree Prototyping")
    builder_type = "research" if dry_run_builders else "self"
    builder_workspace = "inherit" if dry_run_builders else "share"

    async def run_builder(hyp):
        mode_note = (
            "Read-only dry-run simulation: inspect target files, design the exact minimal patch without writing files, and run read-only baseline tests."
            if dry_run_builders
            else "Implement this mutation inside your isolated share workspace (NEVER commit to main), run unit tests and checks, and report measured metrics."
        )
        prompt = (
            f"Prototype hypothesis '{hyp['id']}' on scope {target_scope}.\n"
            f"Goal: {goal}\n"
            f"Claim: {hyp['claim']}\n"
            f"Falsification test: {hyp['falsificationTest']}\n"
            f"Instruction: {mode_note}"
        )
        return await safe_run_agent(
            prompt=prompt,
            schema=PROTOTYPE_SCHEMA,
            role=f"Wave {wave} Prototype {hyp['id']}",
            type_name=builder_type,
            workspace=builder_workspace,
            model=builder_model,
        )

    proto_results = await parallel(accepted_hypotheses, run_builder)
    run_state["subagentCalls"] += len(accepted_hypotheses)

    wave_variants = []
    for idx, res in enumerate(proto_results):
        hyp = accepted_hypotheses[idx]
        var_id = f"var-{hyp['id']}"
        if res.get("status") != "OK":
            wave_variants.append({
                "id": var_id,
                "mutatorArchetype": hyp.get("mutatorArchetype", "unknown"),
                "worktreeBranch": "error-isolated",
                "summary": hyp.get("claim", ""),
                "diffSummary": f"Execution failed: {res.get('error', 'unknown')}",
                "metrics": {"empiricalScore": 0.0, "invarianceRate": 0.0, "cognitiveScore": 0.0, "complexityCost": 1.0},
                "technicalChecks": {"testsPassed": False, "probeViolations": 0, "diffTamperCount": 0, "invarianceFailures": 1},
                "oracles": {
                    "empirical-data": {"passed": False, "reason": "Prototype execution error"},
                    "invariance-fuzzing": {"passed": False, "reason": "Prototype execution error"},
                    "blind-cognitive": {"passed": False, "reason": "Skipped due to build error"},
                    "technical-ab-bench": {"passed": False, "reason": "Prototype execution error"},
                },
            })
            continue

        d = res["data"]
        inv_failures = int(d.get("invarianceFailures", 0))
        tests_ok = bool(d.get("testsPassed", False))
        emp_ok = bool(d.get("empiricalPassed", False))
        wave_variants.append({
            "id": var_id,
            "mutatorArchetype": hyp.get("mutatorArchetype", "unknown"),
            "worktreeBranch": d.get("worktreeBranch") or ("dry-run-readonly" if dry_run_builders else f"share/{var_id}"),
            "summary": d.get("summary", hyp.get("claim", "")),
            "diffSummary": d.get("diffSummary", ""),
            "metrics": {
                "empiricalScore": float(d.get("empiricalScore", 0.0)),
                "invarianceRate": float(d.get("invarianceRate", 0.0)),
                "complexityCost": float(d.get("complexityCost", 1.0)),
            },
            "technicalChecks": {
                "testsPassed": tests_ok,
                "probeViolations": int(d.get("probeViolations", 0)),
                "diffTamperCount": int(d.get("diffTamperCount", 0)),
                "invarianceFailures": inv_failures,
            },
            "oracles": {
                "empirical-data": {"passed": emp_ok, "reason": d.get("empiricalReason", "Empirical check")},
                "invariance-fuzzing": {"passed": inv_failures == 0 and float(d.get("invarianceRate", 0.0)) >= 0.8, "reason": "Invariance suite"},
                "blind-cognitive": {"passed": False, "reason": "Pending blind cognitive oracle"},
                "technical-ab-bench": {"passed": tests_ok and int(d.get("probeViolations", 0)) == 0 and int(d.get("diffTamperCount", 0)) == 0, "reason": "Technical suite"},
            },
        })

    phase(f"Wave {wave} - 4-Oracle Gate & Blind Judges")
    variants_file.write_text(json.dumps(wave_variants, indent=2), encoding="utf-8")
    batch = run_discovery_cli([
        "--sanitize-batch",
        "--variants", str(variants_file),
        "--seed", f"wave-{wave}",
        "--out", str(batch_file),
    ])
    latest_reveal_map.update(batch.get("revealMap", {}))
    blind_payload_json = json.dumps(batch.get("blindCandidates", []), indent=2)

    async def run_cognitive_oracle(_item):
        prompt = (
            f"Act as Blind Cognitive Oracle. Review ONLY these anonymized candidate summaries and metrics "
            f"within a strict 3-5 second clarity budget for goal: {goal}\n\n{blind_payload_json}"
        )
        return await safe_run_agent(
            prompt=prompt,
            schema=COGNITIVE_ORACLE_SCHEMA,
            role=f"Wave {wave} Blind Cognitive Oracle",
            type_name="research",
            workspace="inherit",
            model=judge_model,
        )

    async def run_five_finger_judge(_item):
        prompt = (
            f"Act as Blind 5-Finger Judge (binary 0 or 1 per finger: Pollice, Indice, Medio, Anulare, Mignolo). "
            f"Score each anonymized candidate for goal: {goal}\n\n{blind_payload_json}"
        )
        return await safe_run_agent(
            prompt=prompt,
            schema=FIVE_FINGER_JUDGE_SCHEMA,
            role=f"Wave {wave} Blind 5-Finger Judge",
            type_name="research",
            workspace="inherit",
            model=judge_model,
        )

    judge_results = await parallel(["cognitive", "five-finger"], lambda kind: run_cognitive_oracle(kind) if kind == "cognitive" else run_five_finger_judge(kind))
    run_state["subagentCalls"] += 2

    cog_by_id = {}
    if judge_results[0].get("status") == "OK":
        for ev in judge_results[0]["data"].get("evaluations", []):
            vid = batch.get("revealMap", {}).get(ev.get("blindLabel"))
            if vid:
                cog_by_id[vid] = ev

    finger_by_id = {}
    if judge_results[1].get("status") == "OK":
        for ev in judge_results[1]["data"].get("evaluations", []):
            vid = batch.get("revealMap", {}).get(ev.get("blindLabel"))
            if vid:
                finger_by_id[vid] = ev

    for v in wave_variants:
        cog = cog_by_id.get(v["id"])
        if cog:
            v["oracles"]["blind-cognitive"] = {"passed": bool(cog.get("passed", False)), "reason": cog.get("reason", "")}
            v["metrics"]["cognitiveScore"] = float(cog.get("cognitiveScore", 0.0))
        else:
            v["oracles"]["blind-cognitive"] = {"passed": False, "reason": "Missing blind cognitive verdict"}
            v["metrics"]["cognitiveScore"] = 0.0

        f_ev = finger_by_id.get(v["id"])
        if f_ev and isinstance(f_ev.get("fingers"), list):
            bits = [1 if int(x) == 1 else 0 for x in f_ev["fingers"][:5]]
            while len(bits) < 5:
                bits.append(0)
            v["candidateFingers"] = bits
            v["fiveFingerScore"] = sum(bits)
            v["metrics"]["fiveFingerScore"] = sum(bits)

    all_variants.extend(wave_variants)
    run_state["wavesCompleted"] += 1
    run_state["variantsPrototyped"] = len(all_variants)
    run_state["elapsedMs"] = int(time.time() * 1000) - start_ms

    variants_file.write_text(json.dumps(all_variants, indent=2), encoding="utf-8")
    reveal_file = output_dir / "reveal-map.json"
    reveal_file.write_text(json.dumps(latest_reveal_map, indent=2), encoding="utf-8")
    state_file.write_text(json.dumps(run_state, indent=2), encoding="utf-8")

    eval_out = run_discovery_cli([
        "--evaluate",
        "--brief", str(brief_path),
        "--state", str(state_file),
        "--variants", str(variants_file),
        "--reveal", str(reveal_file),
        "--out-verdict", str(verdict_file),
        "--out-report", str(report_file),
        "--json",
    ])
    verdict = eval_out.get("verdict", {})
    passed_in_wave = sum(1 for v in wave_variants if all(o.get("passed") for o in v.get("oracles", {}).values()))
    if passed_in_wave == 0:
        run_state["consecutiveZeroYieldWaves"] += 1
    else:
        run_state["consecutiveZeroYieldWaves"] = 0

    new_best_delta = float(verdict.get("bestImprovementOverBaseline", 0.0))
    if new_best_delta - best_frontier_delta < min_improvement_delta:
        run_state["consecutiveStagnantWaves"] += 1
    else:
        run_state["consecutiveStagnantWaves"] = 0
        best_frontier_delta = new_best_delta

    orth_count = sum(
        1
        for opt in verdict.get("humanSelectionOptions", [])
        if float(opt.get("improvementOverBaseline", 0.0)) >= target_baseline_margin
    )
    run_state["satisficingOrthogonalCount"] = orth_count

phase("Final Comparative Verdict")
run_state["elapsedMs"] = int(time.time() * 1000) - start_ms
state_file.write_text(json.dumps(run_state, indent=2), encoding="utf-8")
variants_file.write_text(json.dumps(all_variants, indent=2), encoding="utf-8")
reveal_file = output_dir / "reveal-map.json"
reveal_file.write_text(json.dumps(latest_reveal_map, indent=2), encoding="utf-8")

final_out = run_discovery_cli([
    "--evaluate",
    "--brief", str(brief_path),
    "--state", str(state_file),
    "--variants", str(variants_file),
    "--reveal", str(reveal_file),
    "--out-verdict", str(verdict_file),
    "--out-report", str(report_file),
    "--json",
])
final_verdict = final_out.get("verdict", {})
log(f"Discovery Loop finished: exitReason={final_verdict.get('exitReason')} report={report_file}")
print(json.dumps({"exitReason": final_verdict.get("exitReason"), "verdictPath": str(verdict_file), "reportPath": str(report_file)}, indent=2))
