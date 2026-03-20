import { type BunRequest } from "bun";
import {RecordId, Surreal, Table} from 'surrealdb';
import { tools } from "../constants";
import type { Tool, Job, Website } from "../types"

const db = new Surreal();
await db.connect(Bun.env.ORCHESTRATOR_SURREAL_ENDPOINT || 'ws://db:8000', { // the orchestrator may run in another server than the database
    namespace: "main",
    database: "main",
    authentication: {
        username: 'root',
        password: Bun.env.SURREAL_PASS!
    }
});

const users = new Table('users');
const jobs = new Table('jobs');

Bun.serve({
  port: 3000,
  async fetch(req: BunRequest) {
    // validate request
    if(req.method !== "POST") return Response.json({error: "Method Not Allowed", status: 405});
    if(req.headers.get('Authorization') !== `Bearer ${Bun.env.ORCHESTRATOR_KEY}`) return Response.json({error: "Unauthorized", status: 401});
    const data = await req.json();
    if(!Object.hasOwn(data, "target") || !Object.hasOwn(data, "job_id") || !Object.hasOwn(data, "user_id")) return Response.json({error: "Bad Request", status: 400});
    // routes
    const url = new URL(req.url);
    const endpoint = url.pathname.replaceAll('/', '');
    if(tools.includes(endpoint as Tool)) {
        // check that the job_id exists and belongs to the correct user
        const job = await db.select<Job>(new RecordId(jobs, data.job_id));
        if(!job) return Response.json({ error: "Job Not Found" }, { status: 404 });
        // check that the results don't already exist
        if(Object.hasOwn(job, endpoint)) return Response.json({ error: `${endpoint} results already exist` }, { status: 409 });
        // TODO also check for currently running containers, we must save them with the job_id in Redis
        // check that the job belongs to the user & the website is verified
        const website = await db.select<Website>(job.website);
        const userRecordId = new RecordId(users, data.user_id);
        if(!website) return Response.json({ error: "Website Not Found" }, { status: 404 }); // will never happen
        if(website.user != userRecordId) return Response.json({ error: `Forbidden: Wrong User` }, { status: 403 });
        if(!website.verified) return Response.json({ error: `Forbidden: Website Not Verified` }, { status: 403 });
        // TODO run the container

        return Response.json({ success: true });
    } else {
        return Response.json({ error: "Route Not Found" }, { status: 404 });
    }    
  }
});