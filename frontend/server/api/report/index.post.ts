// Copyright (c) 2025 The Linux Foundation and each contributor.
// SPDX-License-Identifier: MIT
import type {ReportRequest} from "~~/types/report/requests.types";
import {createJiraIssue} from "~~/server/data/jira-issue/jira-issue-api";
import {createParagraph, createHeading} from "~~/server/helpers/jira-issue.helpers";

export default defineEventHandler(async (event): Promise<boolean> => {
    const body: ReportRequest = await readBody(event);
    const description = [
            createHeading('Page'),
            createParagraph(body.url, true),
            ...(body.projectName ? [
                createHeading('Project'),
                createParagraph(body.projectName),
            ] : []),
            ...(body.repositoryUrl ? [
                createHeading('Repository'),
                createParagraph(body.repositoryUrl),
            ] : []),
            ...(body.area ? [
                createHeading('Issue Area'),
                createParagraph(body.area),
            ] : []),
            ...(body.widget ? [
                createHeading('Widget'),
                createParagraph(body.widget),
            ] : []),
            createHeading('Description'),
            createParagraph(body.description),
            ...(body.email ? [
                createHeading('Reported by'),
                createParagraph(body.email),
            ] : []),
    ];
    
    await createJiraIssue(
        `[Insights] ${body.projectName ? `${body.projectName} ${body.widget}` : body.pageTitle}`,
        description,
        ['insights-issue'],
        'Bug',
        'Medium',
    )
    return true;
});
