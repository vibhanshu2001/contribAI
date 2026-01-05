import axios from 'axios';
import { IssueCandidate, Repository, User } from '../models';
import { AuthService } from './AuthService';

export class IssueService {
    static async publishIssue(issueId: number, userId: number) {
        const issue = await IssueCandidate.findByPk(issueId);
        if (!issue) throw new Error('Issue candidate not found');

        const repo = await Repository.findByPk(issue.repository_id);
        if (!repo) throw new Error('Repository not found');

        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        const token = AuthService.decryptToken(user.oauth_token_encrypted);

        // Footer
        const footer = '';
        const finalBody = issue.body + footer;

        try {
            const response = await axios.post(
                `https://api.github.com/repos/${repo.owner}/${repo.name}/issues`,
                {
                    title: issue.title,
                    body: finalBody,
                    labels: [issue.category] // optionally add labels
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/vnd.github.v3+json'
                    }
                }
            );

            issue.status = 'published';
            issue.github_issue_url = response.data.html_url;
            await issue.save();

            return response.data;
        } catch (error: any) {
            console.error('GitHub Publish Error', error.response?.data || error);
            throw new Error(error.response?.data?.message || 'Failed to publish issue');
        }
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
