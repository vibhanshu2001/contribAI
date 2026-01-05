import axios from 'axios';
import { IssueCandidate, Repository, User } from '../models';
import { AuthService } from './AuthService';

export class IssueService {
    static async publishIssue(issueId: number, _userId: number) {
        const issue = await IssueCandidate.findByPk(issueId);
        if (!issue) throw new Error('Issue candidate not found');

        // We just mark it as published internally since the actual 
        // creation happens via GitHub UI redirect from the frontend.
        issue.status = 'published';
        await issue.save();

        return { success: true, message: 'Status updated to published' };
    }

    static async updateIssue(issueId: number, updates: any) {
        const issue = await IssueCandidate.findByPk(issueId);
        if (!issue) throw new Error('Issue not found');

        // Allow updating title, body, status
        if (updates.title) issue.title = updates.title;
        if (updates.body) issue.body = updates.body;
        if (updates.status) issue.status = updates.status;

        await issue.save();
        return issue;
    }
}
